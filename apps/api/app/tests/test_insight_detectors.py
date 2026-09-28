from datetime import UTC, date, datetime

from app import insight_detectors as d
from app.fundamentals import FundamentalsSnapshot
from app.insight_sources import select_headlines
from app.market_data import CandlePoint

DAY = 86400
START = 1_700_000_000


def candles(closes: list[float], volumes: list[float] | None = None) -> list[CandlePoint]:
    volumes = volumes or [1000.0] * len(closes)
    return [
        CandlePoint(time=START + i * DAY, open=c, high=c + 1, low=c - 1, close=c, volume=v)
        for i, (c, v) in enumerate(zip(closes, volumes))
    ]


def calm(n: int = 80, base: float = 100.0) -> list[float]:
    # Gentle zig-zag: ~0.5% daily moves, so volatility-based thresholds stay at the floor.
    return [base * (1 + (0.005 if i % 2 else -0.005)) for i in range(n)]


# --- price move ---------------------------------------------------------------------


def test_price_move_below_threshold_is_not_an_event():
    closes = calm() + [calm()[-1] * 1.03]
    assert d.detect_price_move(candles(closes)) == []


def test_price_move_above_threshold_is_important_and_facts_are_measured_values():
    closes = calm() + [calm()[-1] * 0.93]
    [event] = d.detect_price_move(candles(closes))
    assert event.type == "price_move"
    assert event.severity == 2
    assert event.facts["change_pct"] == -7.0
    assert event.facts["threshold_pct"] == 5.0


def test_price_move_twice_the_threshold_is_very_important():
    closes = calm() + [calm()[-1] * 1.12]
    [event] = d.detect_price_move(candles(closes))
    assert event.severity == 3


def test_price_move_threshold_scales_with_a_volatile_stock():
    # ±4% daily swings: 2.5 × volatility (~10%) is above the 5% floor, so 7% isn't unusual.
    swings = [100 * (1.04 if i % 2 else 0.96) for i in range(80)]
    closes = swings + [swings[-1] * 1.07]
    assert d.detect_price_move(candles(closes)) == []


# --- volume, 52 weeks, technical ----------------------------------------------------


def test_volume_spike_is_informational_unless_extreme():
    closes = calm(30)
    [mild] = d.detect_volume_spike(candles(closes, [1000.0] * 29 + [3500.0]))
    [extreme] = d.detect_volume_spike(candles(closes, [1000.0] * 29 + [7000.0]))
    assert (mild.severity, extreme.severity) == (1, 2)
    assert d.detect_volume_spike(candles(closes, [1000.0] * 29 + [2000.0])) == []


def test_52_week_extreme_is_reported_once_per_streak():
    # Flat for a year, then three new highs in a row: only the first one is news.
    closes = [100.0] * 255 + [101.0, 102.0, 103.0]
    series = candles(closes)
    assert d.detect_52_week_extreme(series[:256])[0].type == "week52_high"
    assert d.detect_52_week_extreme(series[:257]) == []
    assert d.detect_52_week_extreme(series) == []


def test_52_week_high_and_low_after_a_quiet_stretch():
    rising = [100.0] * 240 + [99.0] * 20 + [120.0]
    falling = [100.0] * 240 + [101.0] * 20 + [80.0]
    assert d.detect_52_week_extreme(candles(rising))[0].type == "week52_high"
    assert d.detect_52_week_extreme(candles(falling))[0].type == "week52_low"


def test_major_technical_only_reports_todays_major_rules():
    # A long decline then a sharp recovery produces a golden cross near the end.
    closes = [200 - i * 0.5 for i in range(200)] + [100 + i * 2.0 for i in range(60)]
    series = candles(closes)
    for cut in range(210, len(series) + 1):
        events = d.detect_major_technical(series[:cut])
        assert all(e.facts["rule_id"] in d.MAJOR_TECHNICAL_RULES for e in events)
    assert any(d.detect_major_technical(series[:cut]) for cut in range(210, len(series) + 1))


# --- earnings, calendar, filings, fundamentals --------------------------------------


EARNINGS = [
    {"period": "2026-03-31", "actual": 1.5, "estimate": 1.4, "surprisePercent": 7.1},
    {"period": "2026-06-30", "actual": 1.91, "estimate": 1.93, "surprisePercent": -0.9},
]


def test_first_scan_sets_the_earnings_baseline_without_an_event():
    events, newest = d.detect_new_earnings(EARNINGS, None)
    assert events == [] and newest == "2026-06-30"


def test_new_earnings_period_is_an_event_with_the_surprise():
    events, newest = d.detect_new_earnings(EARNINGS, "2026-03-31")
    [event] = events
    assert newest == "2026-06-30"
    assert event.type == "earnings" and event.severity == 2
    assert event.facts == {
        "period": "2026-06-30",
        "eps_actual": 1.91,
        "eps_estimate": 1.93,
        "surprise_pct": -0.9,
    }
    assert d.detect_new_earnings(EARNINGS, "2026-06-30")[0] == []


def test_big_earnings_surprise_is_very_important():
    big = [{"period": "2026-09-30", "actual": 2.4, "estimate": 2.0, "surprisePercent": 20.0}]
    assert d.detect_new_earnings(big, "2026-06-30")[0][0].severity == 3


def test_upcoming_earnings_only_on_the_morning_of_the_report_day():
    calendar = [{"date": "2026-10-03", "hour": "amc"}]
    assert d.detect_upcoming_earnings(calendar, date(2026, 10, 1)) == []
    [event] = d.detect_upcoming_earnings(calendar, date(2026, 10, 3))
    assert event.facts == {"date": "2026-10-03", "days": 0, "hour": "amc"}


def test_filings_only_material_forms_filed_after_last_scan():
    filings = [
        {"form": "4", "filedDate": "2026-09-27 00:00:00"},
        {"form": "8-K", "filedDate": "2026-09-27 00:00:00", "reportUrl": "https://sec.gov/x"},
        {"form": "8-K", "filedDate": "2026-09-26 00:00:00"},
        {"form": "10-Q", "filedDate": "2026-09-20 00:00:00"},
    ]
    [event] = d.detect_filings(filings, since=date(2026, 9, 26))
    assert event.facts == {"form": "8-K", "filed_date": "2026-09-27", "url": "https://sec.gov/x"}


def test_fundamental_changes_ignore_price_driven_ratios():
    previous = {"net_margin": 20.0, "roe": 30.0, "debt_to_equity": 1.0, "eps_growth": 5.0}
    current = FundamentalsSnapshot(
        symbol="X",
        exchange="US",
        pe_ratio=99.0,
        net_margin=16.0,
        roe=31.0,
        debt_to_equity=1.1,
        eps_growth=-2.0,
    )
    events = d.detect_fundamental_changes(previous, current)
    assert {e.facts["metric"] for e in events} == {"net_margin", "eps_growth"}
    assert d.detect_fundamental_changes(None, current) == []


def test_fundamentals_state_keeps_only_statement_driven_metrics():
    snap = FundamentalsSnapshot(symbol="X", exchange="US", pe_ratio=10, net_margin=5, roe=7)
    assert d.fundamentals_state(snap) == {
        "net_margin": 5,
        "roe": 7,
        "debt_to_equity": None,
        "eps_growth": None,
    }


# --- headlines ----------------------------------------------------------------------


def test_select_headlines_drops_old_duplicate_and_directive_titles():
    now = datetime(2026, 9, 28, 6, 0, tzinfo=UTC)
    ts = int(now.timestamp())
    items = [
        {
            "headline": "Apple reports record revenue",
            "source": "Reuters",
            "url": "https://r.com/1",
            "datetime": ts - 3600,
        },
        {
            "headline": "Apple reports record revenue",
            "source": "Yahoo",
            "url": "https://y.com/1",
            "datetime": ts - 7200,
        },
        {
            "headline": "Is Apple a Stock to Buy Now?",
            "source": "Motley",
            "url": "https://m.com/1",
            "datetime": ts - 60,
        },
        {
            "headline": "Analyst cuts Apple price target",
            "source": "X",
            "url": "https://x.com/pt",
            "datetime": ts - 5,
        },
        {
            "headline": "Apple downgraded at Big Bank",
            "source": "X",
            "url": "https://x.com/dg",
            "datetime": ts - 6,
        },
        {"headline": "Old news", "source": "X", "url": "https://x.com", "datetime": ts - 72 * 3600},
        {"headline": "No link", "source": "X", "url": "", "datetime": ts},
        {
            "headline": "Apple files 8-K",
            "source": "SEC",
            "url": "https://s.com",
            "datetime": ts - 10,
        },
    ]
    selected = select_headlines(items, now)
    assert [h.headline for h in selected] == ["Apple files 8-K", "Apple reports record revenue"]
    assert selected[1].source == "Reuters"


def test_select_headlines_keeps_only_stories_about_the_company():
    now = datetime(2026, 9, 28, 6, 0, tzinfo=UTC)
    ts = int(now.timestamp())
    items = [
        {
            "headline": "Nvidia stock jumps after buyback",
            "source": "Yahoo",
            "url": "https://y.com/n",
            "datetime": ts - 1,
        },
        {
            "headline": "Company News for Sep 28, 2026",
            "source": "Yahoo",
            "url": "https://y.com/c",
            "datetime": ts - 2,
        },
        {
            "headline": "Nike Stock Has Dropped 44%. How It Can Double From Here.",
            "source": "B",
            "url": "https://b.com/1",
            "datetime": ts - 3,
        },
        {
            "headline": "Nike names new CFO ahead of earnings",
            "source": "R",
            "url": "https://r.com/1",
            "datetime": ts - 4,
        },
        {
            "headline": "NKE shares slip in premarket",
            "source": "R",
            "url": "https://r.com/2",
            "datetime": ts - 5,
        },
    ]
    selected = select_headlines(items, now, "NKE", "Nike, Inc.")
    assert [h.headline for h in selected] == [
        "Nike names new CFO ahead of earnings",
        "NKE shares slip in premarket",
    ]
