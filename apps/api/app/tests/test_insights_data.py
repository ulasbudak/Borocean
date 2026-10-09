"""Story 13.7 — watchlist symbols in the scan universe and in the user's updates."""

from contextlib import contextmanager
from datetime import UTC, date, datetime

from app import insights


class _Cursor:
    def __init__(self, rows, queries):
        self.rows = rows
        self.queries = queries

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def fetchall(self):
        return self.rows

    def fetchone(self):
        return self.rows[0] if self.rows else None

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def _fake_connection(rows, queries):
    @contextmanager
    def _get_connection():
        class _Conn:
            def cursor(self, row_factory=None):
                return _Cursor(rows, queries)

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

        yield _Conn()

    return _get_connection


def test_scan_universe_puts_held_symbols_before_watched_ones(monkeypatch):
    queries = []
    monkeypatch.setattr(insights, "get_connection", _fake_connection([("AAPL", "Apple")], queries))

    insights.portfolio_universe(300)

    sql = queries[0][0]
    assert "watchlist_items" in sql
    assert "ORDER BY tier, followers DESC" in sql
    assert "NOT IN (SELECT symbol FROM held)" in sql


def test_updates_for_watched_symbols_carry_the_watchlist_source(monkeypatch):
    row = {
        "id": "i1", "symbol": "NVDA", "exchange": "US", "name": "NVIDIA",
        "insight_date": date(2026, 10, 9), "severity": 3, "events": [], "headlines": [],
        "note": None, "note_tone": None, "read": False,
        "created_at": datetime(2026, 10, 9, tzinfo=UTC), "source": "watchlist",
    }
    queries = []
    monkeypatch.setattr(insights, "get_connection", _fake_connection([row], queries))

    items = insights.list_portfolio_insights("user-1", date(2026, 10, 10))

    assert items[0].source == "watchlist"
    # Held wins over watched for a symbol that is in both.
    assert "WHERE NOT EXISTS" in queries[0][0]
