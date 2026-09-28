"""Story 13.1 — deterministic event detectors for the daily portfolio scan.

Every function here is pure: it takes already-fetched data and returns events. That is
what makes "was this day important?" explainable and reproducible (and unit-testable on
fixed data) — the LLM (Story 13.3) only ever *describes* events found here, it never
decides whether something matters.

Severity scale: 1 = informational, 2 = important, 3 = very important. A symbol-day is
stored as an insight only if its highest severity is >= IMPORTANT_SEVERITY.

`facts` only ever holds measured values, never an interpretation. Compliance (Story
12.1): nothing in this module reads or produces a buy/sell/hold recommendation — Finnhub's
`stock/recommendation` endpoint is deliberately never used.
"""

import statistics
from datetime import UTC, date, datetime

from pydantic import BaseModel

from app.fundamentals import FundamentalsSnapshot
from app.market_data import CandlePoint
from app.technical import evaluate_signals

IMPORTANT_SEVERITY = 2

# Calibrated in Story 13.1 against real daily candles (see docs/stories/story-13.1.md).
PRICE_MOVE_MIN_PCT = 5.0
PRICE_MOVE_VOLATILITY_MULTIPLE = 2.5
PRICE_MOVE_LOOKBACK = 60
VOLUME_SPIKE_MULTIPLE = 3.0
VOLUME_LOOKBACK = 20
WEEK52_LOOKBACK = 252
# A stock in a steady trend sets a new 52-week high day after day; only the first one in a
# streak is news. Calibration: counting every day made 52-week highs the noisiest event.
WEEK52_STREAK_DAYS = 20
# Bollinger breakouts were left out after calibration: ±2σ bands are crossed routinely
# (~800 symbol-days in 150 days over 91 symbols), so they are not "important" news.
MAJOR_TECHNICAL_RULES = {"golden_cross", "death_cross"}
EARNINGS_SURPRISE_MAJOR_PCT = 10.0
# Reported once, on the morning of the report day. A multi-day window re-fired the same
# event every morning until the report, which is exactly the noise the scan must avoid.
UPCOMING_EARNINGS_DAYS = 0
MATERIAL_FILING_FORMS = {"8-K", "10-Q", "10-K"}
# Metrics that only move when a new financial statement arrives. P/E and P/B are left out
# on purpose: they move with the price every day and would double-count price moves.
FUNDAMENTAL_CHANGE_RULES = {
    # field: (absolute change threshold, unit)
    "net_margin": (3.0, "pp"),
    "roe": (5.0, "pp"),
    "debt_to_equity": (0.25, "ratio"),
}


class InsightEvent(BaseModel):
    type: str
    severity: int
    facts: dict


def _round(value: float, digits: int = 2) -> float:
    return round(value, digits)


def _daily_returns(closes: list[float]) -> list[float]:
    return [(b - a) / a * 100 for a, b in zip(closes, closes[1:]) if a]


def detect_price_move(candles: list[CandlePoint]) -> list[InsightEvent]:
    if len(candles) < 3:
        return []
    closes = [c.close for c in candles]
    change_pct = (closes[-1] - closes[-2]) / closes[-2] * 100 if closes[-2] else 0.0
    history = _daily_returns(closes[-(PRICE_MOVE_LOOKBACK + 1) : -1])
    volatility = statistics.pstdev(history) if len(history) >= 10 else 0.0
    threshold = max(PRICE_MOVE_MIN_PCT, PRICE_MOVE_VOLATILITY_MULTIPLE * volatility)
    if abs(change_pct) < threshold:
        return []
    severity = 3 if abs(change_pct) >= 2 * threshold else 2
    return [
        InsightEvent(
            type="price_move",
            severity=severity,
            facts={
                "change_pct": _round(change_pct),
                "threshold_pct": _round(threshold),
                "close": _round(closes[-1]),
            },
        )
    ]


def detect_volume_spike(candles: list[CandlePoint]) -> list[InsightEvent]:
    volumes = [c.volume for c in candles]
    if len(volumes) < VOLUME_LOOKBACK + 1 or volumes[-1] is None:
        return []
    window = [v for v in volumes[-(VOLUME_LOOKBACK + 1) : -1] if v]
    if len(window) < VOLUME_LOOKBACK // 2:
        return []
    average = sum(window) / len(window)
    ratio = volumes[-1] / average if average else 0.0
    if ratio < VOLUME_SPIKE_MULTIPLE:
        return []
    # Heavy volume on its own is common around index rebalancing days; it only counts as
    # "important" when it is extreme.
    severity = 2 if ratio >= 2 * VOLUME_SPIKE_MULTIPLE else 1
    return [
        InsightEvent(
            type="volume_spike",
            severity=severity,
            facts={"volume_ratio": _round(ratio, 1), "average_days": VOLUME_LOOKBACK},
        )
    ]


def _extreme_on(closes: list[float], index: int) -> str | None:
    """'high'/'low' if closes[index] is a closing extreme of the 252 days ending there."""
    start = max(0, index - WEEK52_LOOKBACK + 1)
    prior = closes[start:index]
    if len(prior) < WEEK52_LOOKBACK // 2:
        return None
    if closes[index] > max(prior):
        return "high"
    if closes[index] < min(prior):
        return "low"
    return None


def detect_52_week_extreme(candles: list[CandlePoint]) -> list[InsightEvent]:
    closes = [c.close for c in candles]
    last = len(closes) - 1
    side = _extreme_on(closes, last)
    if side is None:
        return []
    recent = range(max(0, last - WEEK52_STREAK_DAYS), last)
    if any(_extreme_on(closes, i) == side for i in recent):
        return []  # same streak as an extreme already reported
    event_type = "week52_high" if side == "high" else "week52_low"
    return [InsightEvent(type=event_type, severity=2, facts={"close": _round(closes[last])})]


def detect_major_technical(candles: list[CandlePoint]) -> list[InsightEvent]:
    if not candles:
        return []
    last_time = candles[-1].time
    return [
        InsightEvent(type="technical", severity=2, facts={"rule_id": s.rule_id})
        for s in evaluate_signals(candles)
        if s.triggered_at == last_time and s.rule_id in MAJOR_TECHNICAL_RULES
    ]


def detect_new_earnings(
    earnings: list[dict], last_seen_period: str | None
) -> tuple[list[InsightEvent], str | None]:
    """Returns (events, newest period). With no previous state (first scan of a symbol),
    the newest period only becomes the baseline — no event, or every symbol would "report
    earnings" on its first day."""
    periods = sorted(
        (e for e in earnings if e.get("period") and e.get("actual") is not None),
        key=lambda e: e["period"],
    )
    if not periods:
        return [], last_seen_period
    newest = periods[-1]
    if last_seen_period is None or newest["period"] <= last_seen_period:
        return [], newest["period"] if last_seen_period is None else last_seen_period
    surprise = newest.get("surprisePercent")
    severity = 3 if surprise is not None and abs(surprise) >= EARNINGS_SURPRISE_MAJOR_PCT else 2
    facts = {"period": newest["period"], "eps_actual": newest["actual"]}
    if newest.get("estimate") is not None:
        facts["eps_estimate"] = newest["estimate"]
    if surprise is not None:
        facts["surprise_pct"] = _round(surprise)
    return [InsightEvent(type="earnings", severity=severity, facts=facts)], newest["period"]


def detect_upcoming_earnings(calendar: list[dict], today: date) -> list[InsightEvent]:
    events = []
    for entry in calendar:
        try:
            when = date.fromisoformat(entry["date"])
        except (KeyError, TypeError, ValueError):
            continue
        days = (when - today).days
        if 0 <= days <= UPCOMING_EARNINGS_DAYS:
            facts = {"date": entry["date"], "days": days}
            if entry.get("hour") in ("bmo", "amc"):
                facts["hour"] = entry["hour"]
            events.append(InsightEvent(type="upcoming_earnings", severity=2, facts=facts))
    return events[:1]


def detect_filings(filings: list[dict], since: date | None) -> list[InsightEvent]:
    """New material SEC filings filed after `since` (the previous scan's date)."""
    events = []
    seen: set[str] = set()
    for filing in filings:
        form = filing.get("form")
        filed = str(filing.get("filedDate", ""))[:10]
        if form not in MATERIAL_FILING_FORMS or not filed or form in seen:
            continue
        if since is not None and filed <= since.isoformat():
            continue
        seen.add(form)
        facts = {"form": form, "filed_date": filed}
        if filing.get("reportUrl"):
            facts["url"] = filing["reportUrl"]
        events.append(InsightEvent(type="filing", severity=2, facts=facts))
    return events


def detect_fundamental_changes(
    previous: dict | None, current: FundamentalsSnapshot
) -> list[InsightEvent]:
    if not previous:
        return []
    events = []
    for field, (threshold, unit) in FUNDAMENTAL_CHANGE_RULES.items():
        before, after = previous.get(field), getattr(current, field)
        if before is None or after is None:
            continue
        change = after - before
        if abs(change) >= threshold:
            events.append(
                InsightEvent(
                    type="fundamental_change",
                    severity=2,
                    facts={
                        "metric": field,
                        "before": _round(before),
                        "after": _round(after),
                        "unit": unit,
                    },
                )
            )
    # EPS growth flipping sign is a change in direction, whatever the size.
    before, after = previous.get("eps_growth"), current.eps_growth
    if before is not None and after is not None and (before >= 0) != (after >= 0):
        events.append(
            InsightEvent(
                type="fundamental_change",
                severity=2,
                facts={
                    "metric": "eps_growth",
                    "before": _round(before),
                    "after": _round(after),
                    "unit": "pct",
                },
            )
        )
    return events


def fundamentals_state(snapshot: FundamentalsSnapshot) -> dict:
    """The part of a fundamentals snapshot kept between scans for detect_fundamental_changes."""
    return {field: getattr(snapshot, field) for field in (*FUNDAMENTAL_CHANGE_RULES, "eps_growth")}


def candle_date(candle: CandlePoint) -> date:
    return datetime.fromtimestamp(candle.time, tz=UTC).date()


def max_severity(events: list[InsightEvent]) -> int:
    return max((e.severity for e in events), default=0)
