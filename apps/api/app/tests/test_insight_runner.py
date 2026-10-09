from datetime import UTC, date, datetime

import pytest
from fastapi.testclient import TestClient

from app import insight_runner as runner
from app import insights, main
from app.auth import get_current_claims
from app.config import Settings
from app.entitlements import Entitlement
from app.fundamentals import FundamentalsSnapshot
from app.insight_detectors import InsightEvent
from app.insight_text import describe_event, push_text
from app.market_data import CandlePoint

DAY = 86400
TODAY = date(2026, 9, 29)


@pytest.fixture
def anyio_backend():
    return "asyncio"


def make_candles(closes: list[float], last_day: date) -> list[CandlePoint]:
    end = int(datetime(last_day.year, last_day.month, last_day.day, tzinfo=UTC).timestamp())
    start = end - (len(closes) - 1) * DAY
    return [
        CandlePoint(time=start + i * DAY, open=c, high=c + 1, low=c - 1, close=c, volume=1000)
        for i, c in enumerate(closes)
    ]


CALM = [100 * (1.005 if i % 2 else 0.995) for i in range(80)]
DROP = CALM + [CALM[-1] * 0.92]


@pytest.fixture
def fake_sources(monkeypatch):
    data = {"candles": make_candles(DROP, date(2026, 9, 26))}

    async def candles(symbol, timeframe, client=None):
        return data["candles"]

    async def fundamentals(symbol, client=None):
        return FundamentalsSnapshot(symbol=symbol, exchange="US", net_margin=20.0, roe=30.0)

    async def empty(*args, **kwargs):
        return []

    monkeypatch.setattr(runner, "get_us_candles", candles)
    monkeypatch.setattr(runner, "get_us_fundamentals", fundamentals)
    for name in ("fetch_earnings", "fetch_earnings_calendar", "fetch_filings", "fetch_headlines"):
        monkeypatch.setattr(runner, name, empty)
    return data


# --- scan_symbol --------------------------------------------------------------------


@pytest.mark.anyio
async def test_first_scan_only_sets_the_baseline(fake_sources):
    result, state = await runner.scan_symbol("AAPL", None, TODAY, client=None)
    assert result.events == []
    assert state.last_candle_date == date(2026, 9, 26)
    assert state.fundamentals["net_margin"] == 20.0


@pytest.mark.anyio
async def test_new_trading_day_with_a_sharp_drop_is_important(fake_sources):
    previous = insights.ScanState(
        last_scanned_date=date(2026, 9, 26), last_candle_date=date(2026, 9, 25)
    )
    result, state = await runner.scan_symbol("AAPL", previous, TODAY, client=None)
    assert result.important
    assert result.events[0].type == "price_move"
    assert state.last_candle_date == date(2026, 9, 26)


@pytest.mark.anyio
async def test_todays_in_progress_candle_is_ignored(fake_sources):
    # A fallback run during the US session: today's partial candle must not be scanned or
    # remembered, or tomorrow's run would skip the completed session.
    fake_sources["candles"] = make_candles(DROP, TODAY)
    previous = insights.ScanState(
        last_scanned_date=date(2026, 9, 26), last_candle_date=date(2026, 9, 25)
    )
    result, state = await runner.scan_symbol("AAPL", previous, TODAY, client=None)
    assert result.events == []  # the -8% "move" is only in today's partial candle
    assert state.last_candle_date == date(2026, 9, 28)


@pytest.mark.anyio
async def test_same_candle_seen_again_on_the_weekend_is_not_counted_twice(fake_sources):
    previous = insights.ScanState(
        last_scanned_date=date(2026, 9, 27), last_candle_date=date(2026, 9, 26)
    )
    result, _ = await runner.scan_symbol("AAPL", previous, TODAY, client=None)
    assert result.events == []


# --- AI note ------------------------------------------------------------------------


def test_parse_note_extracts_tone_and_keeps_disclaimer():
    note, tone = runner.parse_note(
        "Ne oldu: ...\n\nBu içerik yatırım tavsiyesi değildir.\nETKİ: olumsuz"
    )
    assert tone == "negative"
    assert "ETKİ" not in note
    assert note.endswith("yatırım tavsiyesi değildir.")


def test_parse_note_strips_markdown_the_ui_would_show_literally():
    note, _ = runner.parse_note("**Ne oldu**\nFiyat düştü.\n## Riskler\nBorç yüksek.")
    assert note.startswith("Ne oldu\nFiyat düştü.\nRiskler\nBorç yüksek.")
    assert "*" not in note and "#" not in note


def test_parse_note_without_tone_line_still_gets_the_disclaimer():
    note, tone = runner.parse_note("Ne oldu: fiyat düştü.")
    assert tone is None
    assert "yatırım tavsiyesi değildir" in note


def test_note_prompt_carries_compliance_rules_and_no_portfolio_talk():
    assert "al, sat, tut" in runner.NOTE_SYSTEM_PROMPT
    assert "portföyünde tuttuğunu varsayma" in runner.NOTE_SYSTEM_PROMPT


# --- text ---------------------------------------------------------------------------


def test_describe_event_is_factual_in_both_languages():
    move = {"type": "price_move", "facts": {"change_pct": -6.1}}
    assert describe_event(move) == "günlük değişim %-6,1"
    assert describe_event(move, "en") == "daily change -6.1%"
    earnings = {"type": "earnings", "facts": {"surprise_pct": 4.5}}
    assert describe_event(earnings) == "bilanço açıkladı (beklentiden sapma %+4,5)"


def test_push_text_summarizes_at_most_three_symbols():
    items = [
        {"symbol": s, "events": [{"type": "week52_high", "severity": 2, "facts": {}}]}
        for s in ("AAPL", "MSFT", "NVDA", "AMZN")
    ]
    title, body = push_text(items, "tr")
    assert title == "Portföyünde 4 gelişme"
    assert body.startswith("AAPL: 52 haftanın en yüksek kapanışı")
    assert body.endswith("ve 1 diğer")


# --- run_daily_scan -----------------------------------------------------------------


class FakeStore:
    def __init__(self, universe, states=None, notes_today=0):
        self.universe = universe
        self.states = states or {}
        self.notes_today = notes_today
        self.saved = []
        self.notes = []
        self.finished = None
        self.missing = []

    def install(self, monkeypatch):
        monkeypatch.setattr(insights, "start_run", lambda d, t, now: "run-1")
        monkeypatch.setattr(
            insights, "portfolio_universe", lambda limit: [(s, None) for s in self.universe]
        )
        monkeypatch.setattr(insights, "insights_missing_note", lambda d: self.missing)
        monkeypatch.setattr(insights, "count_notes_on", lambda d: self.notes_today)
        monkeypatch.setattr(insights, "get_scan_state", lambda s, e: self.states.get(s))
        monkeypatch.setattr(
            insights, "save_scan_state", lambda s, e, st: self.states.__setitem__(s, st)
        )

        def save_insight(symbol, exchange, d, severity, events, headlines):
            self.saved.append(symbol)
            return f"id-{symbol}"

        monkeypatch.setattr(insights, "save_insight", save_insight)
        monkeypatch.setattr(
            insights, "save_insight_note", lambda i, n, t, v: self.notes.append((i, t))
        )
        monkeypatch.setattr(
            insights,
            "finish_run",
            lambda r, c, status, error=None: setattr(self, "finished", (status, c)),
        )
        monkeypatch.setattr(insights, "push_recipients", lambda d: [])


@pytest.mark.anyio
async def test_run_skips_symbols_already_scanned_today_and_caps_notes(monkeypatch):
    store = FakeStore(
        ["AAPL", "MSFT", "NVDA"],
        states={"MSFT": insights.ScanState(last_scanned_date=TODAY)},
        notes_today=runner.DAILY_NOTE_CAP - 1,
    )
    store.install(monkeypatch)
    scanned = []

    async def fake_scan(symbol, state, today, client):
        scanned.append(symbol)
        event = InsightEvent(type="week52_high", severity=2, facts={"close": 1})
        return runner.ScanResult([event], None), insights.ScanState(last_scanned_date=today)

    async def fake_note(symbol, events, fundamentals, headlines):
        return "not", "neutral"

    async def no_headlines(*args, **kwargs):
        return []

    monkeypatch.setattr(runner, "scan_symbol", fake_scan)
    monkeypatch.setattr(runner, "generate_note", fake_note)
    monkeypatch.setattr(runner, "fetch_headlines", no_headlines)

    result = await runner.run_daily_scan("manual", today=TODAY, pace=False)

    assert scanned == ["AAPL", "NVDA"]
    assert store.saved == ["AAPL", "NVDA"]
    assert store.notes == [("id-AAPL", "neutral")]  # only one note left in today's budget
    assert result["skipped"] == 1 and result["important"] == 2
    assert store.finished[0] == "completed"


@pytest.mark.anyio
async def test_run_counts_a_failing_symbol_and_keeps_going(monkeypatch):
    store = FakeStore(["BAD", "AAPL"])
    store.install(monkeypatch)

    async def fake_scan(symbol, state, today, client):
        if symbol == "BAD":
            raise RuntimeError("provider down")
        return runner.ScanResult([], None), insights.ScanState(last_scanned_date=today)

    monkeypatch.setattr(runner, "scan_symbol", fake_scan)

    result = await runner.run_daily_scan("cron", today=TODAY, pace=False)

    assert (result["failed"], result["processed"]) == (1, 1)
    assert "BAD" not in store.states  # retried by the next trigger


@pytest.mark.anyio
async def test_run_does_nothing_when_another_run_is_live(monkeypatch):
    monkeypatch.setattr(insights, "start_run", lambda d, t, now: None)
    assert await runner.run_daily_scan("cron", today=TODAY) == {"status": "already_running"}


@pytest.mark.anyio
async def test_daily_push_is_one_per_user(monkeypatch):
    rows = [
        {
            "user_id": "u1",
            "token": "tok1",
            "locale": "tr",
            "symbol": "AAPL",
            "severity": 3,
            "events": [{"type": "price_move", "severity": 3, "facts": {"change_pct": -9.0}}],
        },
        {
            "user_id": "u1",
            "token": "tok1",
            "locale": "tr",
            "symbol": "MSFT",
            "severity": 2,
            "events": [{"type": "week52_low", "severity": 2, "facts": {}}],
        },
        {
            "user_id": "u2",
            "token": "tok2",
            "locale": "en",
            "symbol": "AAPL",
            "severity": 3,
            "events": [{"type": "price_move", "severity": 3, "facts": {"change_pct": -9.0}}],
        },
    ]
    already_pushed = {"u2"}
    sent = []
    monkeypatch.setattr(insights, "push_recipients", lambda d: rows)
    monkeypatch.setattr(insights, "log_push", lambda u, d: u not in already_pushed)

    async def fake_push(token, title, body, data=None, client=None):
        assert data == {"type": "portfolio_insights"}
        sent.append((token, title, body))
        return True

    monkeypatch.setattr(runner, "send_expo_push", fake_push)

    assert await runner.send_daily_pushes(TODAY) == 1
    assert sent == [
        (
            "tok1",
            "Portföyünde 2 gelişme",
            "AAPL: günlük değişim %-9, MSFT: 52 haftanın en düşük kapanışı",
        ),
    ]


# --- endpoints ----------------------------------------------------------------------

client = TestClient(main.app)

INSIGHT = insights.Insight(
    id="i1",
    symbol="AAPL",
    exchange="US",
    name="Apple",
    insight_date=TODAY,
    severity=2,
    events=[{"type": "week52_high", "severity": 2, "facts": {"close": 1}}],
    headlines=[],
    note="Not metni",
    note_tone="neutral",
    read=False,
    created_at=datetime(2026, 9, 29, tzinfo=UTC),
)


def entitlement(ai_reports: bool) -> Entitlement:
    return Entitlement(
        tier="free",
        watchlist_item_limit=10,
        alert_limit=3,
        signal_alert_limit=3,
        portfolio_limit=1,
        simulation_limit=1,
        advanced_indicators=False,
        realtime_data=False,
        ai_reports=ai_reports,
    )


@pytest.fixture
def signed_in():
    main.app.dependency_overrides[get_current_claims] = lambda: {"sub": "user-1"}
    yield
    main.app.dependency_overrides.pop(get_current_claims, None)


def test_cron_trigger_requires_the_configured_secret(monkeypatch):
    started = []
    monkeypatch.setattr(
        main.insight_runner, "start_background_scan", lambda t: started.append(t) or True
    )

    monkeypatch.setattr(main, "get_settings", lambda: Settings(cron_secret=""))
    assert client.post("/internal/insights/run").status_code == 503

    monkeypatch.setattr(main, "get_settings", lambda: Settings(cron_secret="s3cret"))
    assert (
        client.post("/internal/insights/run", headers={"X-Cron-Secret": "nope"}).status_code == 401
    )
    response = client.post("/internal/insights/run", headers={"X-Cron-Secret": "s3cret"})
    assert response.status_code == 202 and started == ["cron"]


def test_portfolio_insights_hide_the_note_without_ai_access(monkeypatch, signed_in):
    monkeypatch.setattr(insights, "list_portfolio_insights", lambda u, d: [INSIGHT])
    monkeypatch.setattr(insights, "user_holds_positions", lambda u: True)
    monkeypatch.setattr(insights, "user_watches_symbols", lambda u: False)
    monkeypatch.setattr(insights, "latest_run", lambda d: None)
    monkeypatch.setattr(main.insight_runner, "fallback_due", lambda now: False)
    monkeypatch.setattr(main, "get_entitlement", lambda u: entitlement(ai_reports=False))

    body = client.get("/insights").json()

    [item] = body["insights"]
    assert item["note"] is None and item["note_locked"] is True
    assert item["events"][0]["type"] == "week52_high"
    assert body["unread_count"] == 1
    assert body["holds_positions"] is True


def test_portfolio_insights_start_the_fallback_when_the_morning_run_is_missing(
    monkeypatch, signed_in
):
    started = []
    monkeypatch.setattr(insights, "list_portfolio_insights", lambda u, d: [])
    monkeypatch.setattr(insights, "latest_run", lambda d: None)
    monkeypatch.setattr(insights, "user_holds_positions", lambda u: True)
    monkeypatch.setattr(insights, "user_watches_symbols", lambda u: False)
    monkeypatch.setattr(main.insight_runner, "fallback_due", lambda now: True)
    monkeypatch.setattr(
        main.insight_runner, "start_background_scan", lambda t: started.append(t) or True
    )
    monkeypatch.setattr(main, "get_entitlement", lambda u: entitlement(ai_reports=True))

    body = client.get("/insights").json()

    assert started == ["fallback"]
    assert body["warnings"] and "hazırlanıyor" in body["warnings"][0]


def test_mark_read_only_for_the_caller(monkeypatch, signed_in):
    calls = []
    monkeypatch.setattr(insights, "mark_read", lambda u, ids: calls.append((u, ids)))
    response = client.post("/insights/read", json={"ids": ["i1", "i2"]})
    assert response.status_code == 204
    assert calls == [("user-1", ["i1", "i2"])]


def test_insight_endpoints_require_auth():
    main.app.dependency_overrides.pop(get_current_claims, None)
    assert client.get("/insights").status_code == 401
    assert client.post("/insights/read", json={"ids": []}).status_code == 401


@pytest.mark.anyio
async def test_notes_that_failed_earlier_are_retried_at_the_end_of_a_run(monkeypatch):
    store = FakeStore([])
    store.missing = [
        {
            "id": "id-COST",
            "symbol": "COST",
            "headlines": [],
            "events": [{"type": "filing", "severity": 2, "facts": {"form": "8-K"}}],
        },
    ]
    store.install(monkeypatch)

    async def fundamentals(symbol, client=None):
        return None

    async def fake_note(symbol, events, fundamentals, headlines):
        return "not", "neutral"

    monkeypatch.setattr(runner, "get_us_fundamentals", fundamentals)
    monkeypatch.setattr(runner, "generate_note", fake_note)

    result = await runner.run_daily_scan("cron", today=TODAY, pace=False)

    assert store.notes == [("id-COST", "neutral")]
    assert result["notes_generated"] == 1
