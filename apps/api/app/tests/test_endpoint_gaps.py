"""Endpoint-level coverage the per-module suites leave out: the success and degraded paths
of the three AI report endpoints, and the per-symbol insights endpoint."""

from datetime import UTC, date, datetime

import psycopg
import pytest
from fastapi.testclient import TestClient

from app import insights, main
from app.ai_combined import CombinedAIReport
from app.ai_fundamental import AIReportUnavailableError, FundamentalAIReport
from app.ai_technical import TechnicalAIReport
from app.auth import get_current_claims
from app.entitlements import Entitlement, EntitlementLimitError

client = TestClient(main.app)
NOW = datetime(2026, 10, 9, 12, tzinfo=UTC)
PARAMS = {"symbol": "AAPL", "exchange": "US"}


@pytest.fixture
def signed_in():
    main.app.dependency_overrides[get_current_claims] = lambda: {"sub": "user-1"}
    yield
    main.app.dependency_overrides.pop(get_current_claims, None)


@pytest.fixture
def ai_allowed(monkeypatch):
    monkeypatch.setattr(main, "enforce_ai_reports_access", lambda user_id: None)


def _fundamental():
    return FundamentalAIReport(
        symbol="AAPL", exchange="US", report="Temel rapor", generated_at=NOW, cached=True
    )


def _technical():
    return TechnicalAIReport(
        symbol="AAPL",
        exchange="US",
        report="Teknik rapor",
        detections=[],
        generated_at=NOW,
        cached=False,
    )


def _combined():
    return CombinedAIReport(
        symbol="AAPL", exchange="US", report="Birleşik rapor", generated_at=NOW, cached=False
    )


REPORTS = [
    ("/symbols/ai-report/fundamental", "get_fundamental_report", _fundamental),
    ("/symbols/ai-report/technical", "get_technical_report", _technical),
    ("/symbols/ai-report/combined", "get_combined_report", _combined),
]


@pytest.mark.parametrize(("path", "loader", "factory"), REPORTS)
def test_ai_report_endpoint_returns_the_report(
    monkeypatch, signed_in, ai_allowed, path, loader, factory
):
    async def load(symbol, exchange):
        assert (symbol, exchange) == ("AAPL", "US")
        return factory()

    monkeypatch.setattr(main, loader, load)

    response = client.get(path, params=PARAMS)

    assert response.status_code == 200
    body = response.json()
    assert body["warnings"] == []
    assert body["report"]["symbol"] == "AAPL"
    assert body["report"]["report"] == factory().report


@pytest.mark.parametrize(("path", "loader", "factory"), REPORTS)
def test_ai_report_unavailable_becomes_a_warning(
    monkeypatch, signed_in, ai_allowed, path, loader, factory
):
    async def unavailable(symbol, exchange):
        raise AIReportUnavailableError("Yapay zeka şu an yanıt vermiyor.")

    monkeypatch.setattr(main, loader, unavailable)

    body = client.get(path, params=PARAMS).json()

    assert body["report"] is None
    assert body["warnings"] == ["Yapay zeka şu an yanıt vermiyor."]


@pytest.mark.parametrize(("path", "loader", "factory"), REPORTS)
def test_ai_report_database_error_becomes_a_generic_warning(
    monkeypatch, signed_in, ai_allowed, path, loader, factory
):
    async def broken(symbol, exchange):
        raise psycopg.OperationalError("connection refused")

    monkeypatch.setattr(main, loader, broken)

    response = client.get(path, params=PARAMS)

    assert response.status_code == 200
    assert response.json() == {"report": None, "warnings": ["AI rapor verisi şu an sağlanamıyor."]}


def test_combined_ai_report_is_premium_only(monkeypatch, signed_in):
    def blocked(user_id):
        raise EntitlementLimitError("AI analiz raporları yalnızca premium katmanda kullanılabilir.")

    monkeypatch.setattr(main, "enforce_ai_reports_access", blocked)

    assert client.get("/symbols/ai-report/combined", params=PARAMS).status_code == 403


def test_combined_ai_report_requires_auth():
    main.app.dependency_overrides.pop(get_current_claims, None)
    assert client.get("/symbols/ai-report/combined", params=PARAMS).status_code == 401


# --- /insights/symbol -------------------------------------------------------------------


def _entitlement(ai_reports: bool) -> Entitlement:
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


def _insight(read: bool) -> insights.Insight:
    return insights.Insight(
        id="i1",
        symbol="AAPL",
        exchange="US",
        name="Apple",
        insight_date=date(2026, 10, 9),
        severity=2,
        events=[{"type": "week52_high", "severity": 2, "facts": {"close": 1}}],
        headlines=[],
        note="Not metni",
        note_tone="neutral",
        read=read,
        created_at=NOW,
    )


def test_symbol_insights_normalize_the_symbol_and_count_unread(monkeypatch, signed_in):
    calls = []

    def list_symbol(user_id, symbol, exchange, today):
        calls.append((user_id, symbol, exchange))
        return [_insight(read=False), _insight(read=True)]

    monkeypatch.setattr(insights, "list_symbol_insights", list_symbol)
    monkeypatch.setattr(main, "get_entitlement", lambda u: _entitlement(ai_reports=True))

    response = client.get("/insights/symbol", params={"symbol": " aapl ", "exchange": "us"})

    assert response.status_code == 200
    body = response.json()
    assert calls == [("user-1", "AAPL", "US")]
    assert body["unread_count"] == 1
    assert body["run"] is None and body["warnings"] == []
    assert body["insights"][0]["note"] == "Not metni"


def test_symbol_insights_hide_the_note_without_ai_access(monkeypatch, signed_in):
    monkeypatch.setattr(insights, "list_symbol_insights", lambda *a: [_insight(read=False)])
    monkeypatch.setattr(main, "get_entitlement", lambda u: _entitlement(ai_reports=False))

    [item] = client.get("/insights/symbol", params={"symbol": "AAPL"}).json()["insights"]

    assert item["note"] is None and item["note_locked"] is True


def test_symbol_insights_database_error_is_503(monkeypatch, signed_in):
    def broken(*args):
        raise psycopg.OperationalError("down")

    monkeypatch.setattr(insights, "list_symbol_insights", broken)

    assert client.get("/insights/symbol", params={"symbol": "AAPL"}).status_code == 503


def test_portfolio_insights_database_error_is_503(monkeypatch, signed_in):
    def broken(*args):
        raise psycopg.OperationalError("down")

    monkeypatch.setattr(insights, "list_portfolio_insights", broken)

    assert client.get("/insights").status_code == 503


def test_symbol_insights_require_auth():
    main.app.dependency_overrides.pop(get_current_claims, None)
    assert client.get("/insights/symbol", params={"symbol": "AAPL"}).status_code == 401
