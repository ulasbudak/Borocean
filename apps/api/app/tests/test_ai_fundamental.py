from datetime import UTC, datetime

import httpx
import pytest

from app import ai_fundamental, ai_reports
from app.ai_fundamental import AIReportUnavailableError, get_fundamental_report
from app.config import Settings
from app.fundamentals import FundamentalsSnapshot, FundamentalsUnavailableError

NOW = datetime(2026, 1, 1, tzinfo=UTC)


@pytest.fixture(autouse=True)
def patch_settings(monkeypatch):
    monkeypatch.setattr(
        ai_reports,
        "get_settings",
        lambda: Settings(google_api_key="test-key", gemini_model="gemini-test"),
    )


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _gemini_response() -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "candidates": [
                {"content": {"parts": [{"text": "Test temel analiz raporu."}]}}
            ]
        },
    )


@pytest.mark.anyio
async def test_returns_cached_report_without_calling_gemini(monkeypatch):
    monkeypatch.setattr(
        ai_fundamental,
        "get_cached_report",
        lambda symbol, exchange, report_type, ttl_hours, locale="tr": (
            {"report": "Önbellekteki rapor"},
            NOW,
        ),
    )

    def unexpected_call(request: httpx.Request) -> httpx.Response:
        raise AssertionError("should not call Gemini when cache is fresh")

    transport = httpx.MockTransport(unexpected_call)
    async with httpx.AsyncClient(transport=transport) as http_client:
        report = await get_fundamental_report("AAPL", "US", client=http_client)

    assert report.cached is True
    assert report.report == "Önbellekteki rapor"


@pytest.mark.anyio
async def test_raises_for_bist_when_not_cached(monkeypatch):
    monkeypatch.setattr(
        ai_fundamental, "get_cached_report", lambda *a, **k: None
    )

    with pytest.raises(AIReportUnavailableError):
        await get_fundamental_report("GARAN", "BIST")


@pytest.mark.anyio
async def test_raises_when_fundamentals_unavailable(monkeypatch):
    async def fake_get_us_fundamentals(symbol, *, client=None):
        raise FundamentalsUnavailableError("no data")

    monkeypatch.setattr(ai_fundamental, "get_cached_report", lambda *a, **k: None)
    monkeypatch.setattr(ai_fundamental, "get_us_fundamentals", fake_get_us_fundamentals)

    with pytest.raises(AIReportUnavailableError):
        await get_fundamental_report("AAPL", "US")


@pytest.mark.anyio
async def test_generates_and_saves_report_on_cache_miss(monkeypatch):
    saved = {}

    async def fake_get_us_fundamentals(symbol, *, client=None):
        return FundamentalsSnapshot(symbol="AAPL", exchange="US", pe_ratio=28.5)

    async def fake_get_us_sector_comparison(symbol, snapshot, *, client=None):
        return None

    async def fake_get_us_historical_performance(symbol, *, client=None):
        return None

    def fake_save_report(symbol, exchange, report_type, content, locale="tr"):
        saved["symbol"] = symbol
        saved["exchange"] = exchange
        saved["report_type"] = report_type
        saved["content"] = content
        return NOW

    monkeypatch.setattr(ai_fundamental, "get_cached_report", lambda *a, **k: None)
    monkeypatch.setattr(ai_fundamental, "get_us_fundamentals", fake_get_us_fundamentals)
    monkeypatch.setattr(ai_fundamental, "get_us_sector_comparison", fake_get_us_sector_comparison)
    monkeypatch.setattr(
        ai_fundamental, "get_us_historical_performance", fake_get_us_historical_performance
    )
    monkeypatch.setattr(ai_fundamental, "save_report", fake_save_report)

    def handler(request: httpx.Request) -> httpx.Response:
        assert "generativelanguage.googleapis.com" in str(request.url)
        assert request.headers["x-goog-api-key"] == "test-key"
        return _gemini_response()

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        report = await get_fundamental_report("AAPL", "US", client=http_client)

    assert report.cached is False
    assert report.report.startswith("Test temel analiz raporu.")
    # The model left out the disclaimer, so ensure_disclaimer appended it (Story 12.1).
    assert report.report.endswith("bilgilendirme amacı taşır.")
    assert saved["symbol"] == "AAPL"
    assert saved["report_type"] == "fundamental"
    assert saved["content"]["report"] == report.report


@pytest.mark.anyio
async def test_raises_when_google_api_key_missing(monkeypatch):
    monkeypatch.setattr(ai_reports, "get_settings", lambda: Settings(google_api_key=""))
    monkeypatch.setattr(ai_fundamental, "get_cached_report", lambda *a, **k: None)

    async def fake_get_us_fundamentals(symbol, *, client=None):
        return FundamentalsSnapshot(symbol="AAPL", exchange="US", pe_ratio=28.5)

    async def fake_get_us_sector_comparison(symbol, snapshot, *, client=None):
        return None

    async def fake_get_us_historical_performance(symbol, *, client=None):
        return None

    monkeypatch.setattr(ai_fundamental, "get_us_fundamentals", fake_get_us_fundamentals)
    monkeypatch.setattr(ai_fundamental, "get_us_sector_comparison", fake_get_us_sector_comparison)
    monkeypatch.setattr(
        ai_fundamental, "get_us_historical_performance", fake_get_us_historical_performance
    )

    with pytest.raises(AIReportUnavailableError):
        await get_fundamental_report("AAPL", "US")


@pytest.mark.anyio
async def test_call_gemini_retries_on_transient_503(monkeypatch):
    monkeypatch.setattr(ai_reports.asyncio, "sleep", lambda *_: _noop_sleep())

    calls = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["count"] += 1
        if calls["count"] < 3:
            return httpx.Response(503, json={"error": {"message": "model overloaded"}})
        return _gemini_response()

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        text = await ai_reports.call_gemini("system", "user", client=http_client)

    assert text == "Test temel analiz raporu."
    assert calls["count"] == 3


@pytest.mark.anyio
async def test_call_gemini_does_not_retry_non_transient_errors(monkeypatch):
    monkeypatch.setattr(ai_reports.asyncio, "sleep", lambda *_: _noop_sleep())

    calls = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["count"] += 1
        return httpx.Response(400, json={"error": {"message": "bad request"}})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        with pytest.raises(AIReportUnavailableError):
            await ai_reports.call_gemini("system", "user", client=http_client)

    assert calls["count"] == 1


async def _noop_sleep():
    return None


def test_get_cached_report_ignores_stale_rows(monkeypatch):
    from contextlib import contextmanager

    class FakeCursor:
        def execute(self, query, params=None):
            pass

        def fetchone(self):
            return {"content": {"report": "old"}, "generated_at": datetime(2020, 1, 1, tzinfo=UTC)}

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    class FakeConnection:
        def cursor(self, row_factory=None):
            return FakeCursor()

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    @contextmanager
    def fake_get_connection():
        yield FakeConnection()

    monkeypatch.setattr(ai_reports, "get_connection", fake_get_connection)

    result = ai_reports.get_cached_report("AAPL", "US", "fundamental", ttl_hours=24.0)

    assert result is None


def test_system_prompt_forbids_buy_sell_direction_and_price_targets():
    """Story 12.1 — SPK: the report is analysis, never a personal buy/sell/hold call."""
    from app.ai_fundamental import SYSTEM_PROMPT

    assert "al, sat, tut" in SYSTEM_PROMPT
    assert "Hedef fiyat" in SYSTEM_PROMPT
    assert "risk profiline" in SYSTEM_PROMPT
    assert "'Riskler'" in SYSTEM_PROMPT


@pytest.mark.anyio
async def test_english_users_get_an_english_report_cached_under_their_own_language(monkeypatch):
    import json

    seen = {}

    async def fake_get_us_fundamentals(symbol, *, client=None):
        return FundamentalsSnapshot(symbol="AAPL", exchange="US", pe_ratio=28.5)

    async def none_async(*args, **kwargs):
        return None

    def fake_cached(symbol, exchange, report_type, ttl_hours, locale="tr"):
        seen["read_locale"] = locale
        return None

    def fake_save_report(symbol, exchange, report_type, content, locale="tr"):
        seen["saved_locale"] = locale
        return NOW

    monkeypatch.setattr(ai_fundamental, "get_cached_report", fake_cached)
    monkeypatch.setattr(ai_fundamental, "get_us_fundamentals", fake_get_us_fundamentals)
    monkeypatch.setattr(ai_fundamental, "get_us_sector_comparison", none_async)
    monkeypatch.setattr(ai_fundamental, "get_us_historical_performance", none_async)
    monkeypatch.setattr(ai_fundamental, "save_report", fake_save_report)

    def handler(request: httpx.Request) -> httpx.Response:
        system = json.loads(request.content)["systemInstruction"]["parts"][0]["text"]
        seen["system_prompt"] = system
        return _gemini_response()

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        report = await get_fundamental_report("AAPL", "US", locale="en", client=http_client)

    assert seen["read_locale"] == seen["saved_locale"] == "en"
    assert "İngilizce" in seen["system_prompt"]
    # The compliance rules are still part of the prompt in English mode.
    assert "yönlendirme" in seen["system_prompt"]
    assert report.report.endswith("for information only.")
