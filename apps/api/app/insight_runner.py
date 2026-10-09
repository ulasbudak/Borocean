"""Epic 13 — the morning portfolio scan (Stories 13.1–13.3, 13.6).

Triggered by Supabase pg_cron → pg_net → POST /internal/insights/run (05:30 UTC, re-fired
at 06:30 and 07:30 to finish leftovers), or by the fallback when a user opens their
portfolio and today's run never started. See docs/product-brief-epic13-portfolio-insights.md.

Budget rules, so the scan never starves live users:
- Twelve Data: the process-wide throttle allows 8 calls/min; the scan paces itself to one
  symbol (one candle call) every SYMBOL_INTERVAL_SECONDS, i.e. at most 4/min.
- At most DAILY_SYMBOL_CAP symbols a day (most-held first) and DAILY_NOTE_CAP AI notes.
Idempotent: a symbol already scanned today is skipped, so a re-trigger only does leftovers.
"""

import asyncio
import logging
import re
import time
from datetime import UTC, date, datetime

import httpx

from app import insights
from app.ai_reports import (
    COMPLIANCE_RULES,
    DISCLAIMER_LINE,
    PROMPT_VERSION,
    AIReportUnavailableError,
    call_gemini,
    ensure_disclaimer,
)
from app.fundamentals import FundamentalsSnapshot, FundamentalsUnavailableError, get_us_fundamentals
from app.insight_detectors import (
    IMPORTANT_SEVERITY,
    InsightEvent,
    candle_date,
    detect_52_week_extreme,
    detect_filings,
    detect_fundamental_changes,
    detect_major_technical,
    detect_new_earnings,
    detect_price_move,
    detect_upcoming_earnings,
    detect_volume_spike,
    fundamentals_state,
    max_severity,
)
from app.insight_sources import (
    Headline,
    fetch_earnings,
    fetch_earnings_calendar,
    fetch_filings,
    fetch_headlines,
)
from app.insight_text import describe_event, push_text
from app.market_data import background_lane, get_us_candles
from app.notifications import send_expo_push

logger = logging.getLogger(__name__)

EXCHANGE = "US"
DAILY_SYMBOL_CAP = 300
DAILY_NOTE_CAP = 50
SYMBOL_INTERVAL_SECONDS = 15.0
NOTE_RETRY_INTERVAL_SECONDS = 10.0
# The mobile app opens the portfolio screen when a push carrying this is tapped.
PUSH_DATA = {"type": "portfolio_insights"}
# The fallback only fires after the scheduled run should have started.
SCHEDULED_HOUR_UTC = 5
SCHEDULED_MINUTE_UTC = 45

NOTE_SYSTEM_PROMPT = (
    "Sen Borocean uygulaması için kamuya açık verileri özetleyen bir analiz aracısın. Sana "
    "bir şirket için bugün kurallarla tespit edilmiş olaylar, şirketin temel metrikleri ve "
    "varsa son haber başlıkları verilecek. Türkçe, en fazla 120 kelimelik, bilgilendirme "
    "amaçlı kısa bir not yaz ve şu başlıkları kullan: 'Ne oldu' (olayları sayılarıyla "
    "anlat), 'Veride neyi değiştiriyor' (olayın şirketin verisindeki objektif anlamı), "
    "'Dikkat edilebilecek riskler'. Başlıkları kendi satırlarında, sonlarına iki nokta "
    "koyarak düz metin olarak yaz; markdown (**, #, madde işareti) kullanma. "
    "Haber başlıklarını yalnızca bağlam olarak kullan; "
    "başlıkta yazmayan bir ayrıntı ekleme ve haber metnini tahmin etme. Başlıklarda geçse "
    "bile analistlerin hedef fiyatlarını, not/tavsiye değişikliklerini ve fiyat "
    "beklentilerini aktarma. Okurun bu hisseyi "
    "portföyünde tuttuğunu varsayma ve portföyüne dair hiçbir şey söyleme. "
    + COMPLIANCE_RULES
    + f" Notun sonunda ayrı bir satırda şunu yaz: '{DISCLAIMER_LINE}' En son satıra ise "
    "yalnızca şu biçimde olayların veriye etkisini yaz: 'ETKİ: olumlu', 'ETKİ: olumsuz', "
    "'ETKİ: nötr' veya 'ETKİ: karışık'."
)

_TONE_LINE = re.compile(
    r"^\s*ETK[İI]\s*:\s*(olumlu|olumsuz|nötr|karışık)\s*$", re.IGNORECASE | re.M
)
_MARKDOWN_BOLD = re.compile(r"\*\*(.+?)\*\*")
_MARKDOWN_HEADING = re.compile(r"^\s*#+\s*", re.M)
_TONES = {"olumlu": "positive", "olumsuz": "negative", "nötr": "neutral", "karışık": "mixed"}

_running_task: asyncio.Task | None = None


class ScanResult:
    def __init__(self, events: list[InsightEvent], fundamentals: FundamentalsSnapshot | None):
        self.events = events
        self.fundamentals = fundamentals

    @property
    def important(self) -> bool:
        return max_severity(self.events) >= IMPORTANT_SEVERITY


async def scan_symbol(
    symbol: str, state: insights.ScanState | None, today: date, client: httpx.AsyncClient
) -> tuple[ScanResult, insights.ScanState]:
    # Only completed sessions: a candle dated on/after the run date is today's session
    # still in progress (fallback runs can happen while the US market is open). At the
    # 05:30 UTC morning run it is still the previous day in New York, so nothing is lost.
    candles = [
        c for c in await get_us_candles(symbol, "daily", client=client) if candle_date(c) < today
    ]
    try:
        fundamentals = await get_us_fundamentals(symbol, client=client)
    except FundamentalsUnavailableError:
        fundamentals = None
    earnings, calendar, filings = await asyncio.gather(
        fetch_earnings(symbol, client),
        fetch_earnings_calendar(symbol, today, client),
        fetch_filings(symbol, today, client),
    )

    events: list[InsightEvent] = []
    last_candle = candle_date(candles[-1]) if candles else None
    new_candle = last_candle is not None and (
        state is None or state.last_candle_date is None or last_candle > state.last_candle_date
    )
    # Candle events only for a trading day not seen before (the cron also fires on weekends),
    # and never on the first scan of a symbol, which only sets the baseline.
    if new_candle and state is not None:
        for detector in (
            detect_price_move,
            detect_volume_spike,
            detect_52_week_extreme,
            detect_major_technical,
        ):
            events.extend(detector(candles))

    earnings_events, newest_period = detect_new_earnings(
        earnings, state.last_earnings_period if state else None
    )
    events.extend(earnings_events)
    events.extend(detect_upcoming_earnings(calendar, today))
    if state is not None:
        events.extend(detect_filings(filings, since=state.last_scanned_date))
    if fundamentals is not None:
        events.extend(
            detect_fundamental_changes(state.fundamentals if state else None, fundamentals)
        )

    new_state = insights.ScanState(
        last_scanned_date=today,
        last_candle_date=last_candle or (state.last_candle_date if state else None),
        last_earnings_period=newest_period,
        fundamentals=fundamentals_state(fundamentals)
        if fundamentals is not None
        else (state.fundamentals if state else None),
    )
    events.sort(key=lambda e: e.severity, reverse=True)
    return ScanResult(events, fundamentals), new_state


def _note_prompt(
    symbol: str,
    events: list[dict],
    fundamentals: FundamentalsSnapshot | None,
    headlines: list[Headline],
) -> str:
    lines = [f"Sembol: {symbol} (ABD)", "", "Bugün tespit edilen olaylar:"]
    lines += [f"- {describe_event(e)}" for e in events]
    if fundamentals is not None:
        metrics = {
            "F/K": fundamentals.pe_ratio,
            "ROE (%)": fundamentals.roe,
            "Net marj (%)": fundamentals.net_margin,
            "Borç/özsermaye": fundamentals.debt_to_equity,
            "EPS büyümesi (%)": fundamentals.eps_growth,
        }
        known = [f"{k}: {v:.2f}" for k, v in metrics.items() if v is not None]
        if known:
            lines += ["", "Temel metrikler: " + ", ".join(known)]
    if headlines:
        lines += ["", "Son haber başlıkları (yalnızca başlık):"]
        lines += [f"- {h.headline} ({h.source})" for h in headlines]
    return "\n".join(lines)


def parse_note(text: str) -> tuple[str, str | None]:
    """Splits the model's trailing 'ETKİ: ...' line off the note."""
    match = None
    for match in _TONE_LINE.finditer(text):
        pass
    tone = _TONES.get(match.group(1).lower()) if match else None
    note = _TONE_LINE.sub("", text)
    # The UI shows the note as plain text; drop markdown the model adds anyway
    # ("**Ne oldu**" rendered literally in the first live run).
    note = _MARKDOWN_BOLD.sub(r"\1", note)
    note = _MARKDOWN_HEADING.sub("", note).strip()
    return ensure_disclaimer(note), tone


async def generate_note(
    symbol: str,
    events: list[dict],
    fundamentals: FundamentalsSnapshot | None,
    headlines: list[Headline],
) -> tuple[str, str | None]:
    text = await call_gemini(
        NOTE_SYSTEM_PROMPT, _note_prompt(symbol, events, fundamentals, headlines)
    )
    return parse_note(text)


async def backfill_missing_notes(
    today: date, budget: int, client: httpx.AsyncClient, *, pace: bool = True
) -> int:
    generated = 0
    missing = await asyncio.to_thread(insights.insights_missing_note, today)
    for index, row in enumerate(missing[:budget]):
        # Back-to-back Gemini calls hit the free tier's per-minute limit (429 in the first
        # live retry); the main loop is already paced by SYMBOL_INTERVAL_SECONDS.
        if pace and index:
            await asyncio.sleep(NOTE_RETRY_INTERVAL_SECONDS)
        try:
            fundamentals = await get_us_fundamentals(row["symbol"], client=client)
        except FundamentalsUnavailableError:
            fundamentals = None
        headlines = [Headline(**h) for h in row["headlines"]]
        try:
            note, tone = await generate_note(row["symbol"], row["events"], fundamentals, headlines)
        except AIReportUnavailableError as exc:
            logger.warning("insight note retry for %s failed: %s", row["symbol"], exc)
            continue
        await asyncio.to_thread(
            insights.save_insight_note, str(row["id"]), note, tone, PROMPT_VERSION
        )
        generated += 1
    return generated


async def send_daily_pushes(today: date) -> int:
    rows = await asyncio.to_thread(insights.push_recipients, today)
    by_user: dict[str, dict] = {}
    for row in rows:
        entry = by_user.setdefault(
            str(row["user_id"]), {"token": row["token"], "locale": row["locale"], "items": []}
        )
        if all(item["symbol"] != row["symbol"] for item in entry["items"]):
            entry["items"].append({"symbol": row["symbol"], "events": row["events"]})
    sent = 0
    for user_id, entry in by_user.items():
        # Claim the day first so a concurrent run can't push the same user twice.
        if not await asyncio.to_thread(insights.log_push, user_id, today):
            continue
        title, body = push_text(entry["items"], entry["locale"])
        if await send_expo_push(entry["token"], title, body, data=PUSH_DATA):
            sent += 1
    return sent


async def run_daily_scan(trigger: str, *, today: date | None = None, pace: bool = True) -> dict:
    now = datetime.now(UTC)
    today = today or now.date()
    run_id = await asyncio.to_thread(insights.start_run, today, trigger, now)
    if run_id is None:
        return {"status": "already_running"}

    counters = {
        k: 0
        for k in (
            "universe_size",
            "processed",
            "skipped",
            "important",
            "failed",
            "notes_generated",
            "pushes_sent",
        )
    }
    try:
        universe = await asyncio.to_thread(insights.portfolio_universe, DAILY_SYMBOL_CAP)
        counters["universe_size"] = len(universe)
        notes_left = DAILY_NOTE_CAP - await asyncio.to_thread(insights.count_notes_on, today)
        async with httpx.AsyncClient(timeout=10.0) as client:
            last_started = 0.0
            for symbol, name in universe:
                state = await asyncio.to_thread(insights.get_scan_state, symbol, EXCHANGE)
                if state is not None and state.last_scanned_date == today:
                    counters["skipped"] += 1
                    continue
                if pace:
                    wait = SYMBOL_INTERVAL_SECONDS - (time.monotonic() - last_started)
                    if wait > 0:
                        await asyncio.sleep(wait)
                last_started = time.monotonic()
                try:
                    result, new_state = await scan_symbol(symbol, state, today, client)
                    if result.important:
                        events = [e.model_dump() for e in result.events]
                        headlines = await fetch_headlines(symbol, datetime.now(UTC), client, name)
                        insight_id = await asyncio.to_thread(
                            insights.save_insight,
                            symbol,
                            EXCHANGE,
                            today,
                            max_severity(result.events),
                            events,
                            [h.model_dump(mode="json") for h in headlines],
                        )
                        counters["important"] += 1
                        if notes_left > 0:
                            try:
                                note, tone = await generate_note(
                                    symbol, events, result.fundamentals, headlines
                                )
                                await asyncio.to_thread(
                                    insights.save_insight_note,
                        insight_id,
                        note,
                        tone,
                        PROMPT_VERSION,
                                )
                                counters["notes_generated"] += 1
                                notes_left -= 1
                            except AIReportUnavailableError as exc:
                                logger.warning("insight note for %s failed: %s", symbol, exc)
                    await asyncio.to_thread(insights.save_scan_state, symbol, EXCHANGE, new_state)
                    counters["processed"] += 1
                except Exception:
                    logger.exception("insight scan for %s failed", symbol)
                    counters["failed"] += 1
            # A transient Gemini failure (e.g. 503) leaves an update without a note; the
            # 06:30/07:30 re-triggers skip already-scanned symbols, so notes are retried here.
            if notes_left > 0:
                counters["notes_generated"] += await backfill_missing_notes(
                    today, notes_left, client, pace=pace
                )
        counters["pushes_sent"] = await send_daily_pushes(today)
        await asyncio.to_thread(insights.finish_run, run_id, counters, "completed")
    except Exception as exc:
        logger.exception("insight run failed")
        await asyncio.to_thread(insights.finish_run, run_id, counters, "failed", str(exc)[:500])
        raise
    return {"status": "completed", **counters}


def start_background_scan(trigger: str) -> bool:
    """Starts a scan as a background task in this process. Returns False if one is already
    running here (the DB check in start_run guards across processes)."""
    global _running_task
    if _running_task is not None and not _running_task.done():
        return False

    async def _run():
        try:
            with background_lane():
                await run_daily_scan(trigger)
        except Exception:
            logger.exception("background insight scan crashed")

    _running_task = asyncio.get_running_loop().create_task(_run())
    return True


def fallback_due(now: datetime) -> bool:
    return (now.hour, now.minute) >= (SCHEDULED_HOUR_UTC, SCHEDULED_MINUTE_UTC)
