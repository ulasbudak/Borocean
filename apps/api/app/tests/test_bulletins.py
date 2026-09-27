from contextlib import contextmanager
from datetime import UTC, date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app import ai_reports, bulletins, main
from app.ai_reports import AIReportUnavailableError
from app.auth import get_current_claims
from app.bulletins import Bulletin, Pick, get_or_create_todays_bulletin, pick_sector_for_date
from app.config import Settings
from app.entitlements import EntitlementLimitError
from app.fundamentals import FundamentalsSnapshot

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


# --- sector rotation -------------------------------------------------------------


def test_pick_sector_for_date_is_deterministic():
    d = date(2026, 3, 15)

    assert pick_sector_for_date(d) == pick_sector_for_date(d)


def test_pick_sector_for_date_covers_all_sectors_over_a_year():
    picks = {pick_sector_for_date(date(2026, 1, 1) + timedelta(days=i)) for i in range(366)}

    assert picks == set(bulletins.SECTORS)


# --- get_or_create_todays_bulletin ------------------------------------------------


def _row(picks, content="Var olan bülten"):
    return {
        "bulletin_date": date.today(),
        "sector": "Technology",
        "picks": picks,
        "content": content,
        "created_at": NOW,
    }


LEGACY_PICKS = [{"symbol": "AAPL", "name": "Apple Inc.", "score": 82, "label": "Al"}]
APPLE = FundamentalsSnapshot(symbol="AAPL", exchange="US", market_cap=3.0e12, pe_ratio=30.0)


@pytest.mark.anyio
async def test_returns_existing_bulletin_without_fetching(monkeypatch):
    monkeypatch.setattr(
        bulletins, "_get_bulletin_row", lambda d: _row([{"symbol": "AAPL", "name": "Apple"}])
    )

    def unexpected_call(sector):
        raise AssertionError("should not fetch a sector when today's bulletin already exists")

    monkeypatch.setattr(bulletins, "_select_sector_companies", unexpected_call)

    result = await get_or_create_todays_bulletin()

    assert result.content == "Var olan bülten"


@pytest.mark.anyio
async def test_raises_when_no_companies_found(monkeypatch):
    monkeypatch.setattr(bulletins, "_get_bulletin_row", lambda d: None)

    async def fake_select(sector):
        return []

    monkeypatch.setattr(bulletins, "_select_sector_companies", fake_select)

    with pytest.raises(AIReportUnavailableError):
        await get_or_create_todays_bulletin()


@pytest.mark.anyio
async def test_regenerates_todays_legacy_bulletin_in_place(monkeypatch):
    """Story 12.1: a pre-12.1 bulletin (picks with Al/Nötr/Sat labels) is replaced."""
    monkeypatch.setattr(bulletins, "_get_bulletin_row", lambda d: _row(LEGACY_PICKS))

    async def fake_select(sector):
        return [(Pick(symbol="AAPL", name="Apple Inc.", market_cap=3.0e12), APPLE)]

    async def fake_call_gemini(system_prompt, user_prompt, *, client=None):
        return "Yeni bülten."

    replaced = {}

    def fake_replace(bulletin_date, sector, picks, content):
        replaced["content"] = content
        return Bulletin(
            bulletin_date=bulletin_date, sector=sector, picks=picks, content=content,
            created_at=NOW,
        )

    def unexpected_save(*args):
        raise AssertionError("a legacy row must be updated, not inserted")

    monkeypatch.setattr(bulletins, "_select_sector_companies", fake_select)
    monkeypatch.setattr(bulletins, "call_gemini", fake_call_gemini)
    monkeypatch.setattr(bulletins, "_replace_legacy_bulletin", fake_replace)
    monkeypatch.setattr(bulletins, "_save_bulletin", unexpected_save)

    result = await get_or_create_todays_bulletin()

    assert result.content.startswith("Yeni bülten.")
    assert "yatırım tavsiyesi değildir" in result.content  # appended by ensure_disclaimer


def test_list_bulletins_hides_legacy_rows(monkeypatch):
    rows = [_row([{"symbol": "MSFT", "name": "Microsoft"}], "yeni"), _row(LEGACY_PICKS, "eski")]

    class FakeCursor:
        def execute(self, query, params=None):
            pass

        def fetchall(self):
            return rows

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

    monkeypatch.setattr(bulletins, "get_connection", fake_get_connection)

    assert [b.content for b in bulletins.list_bulletins()] == ["yeni"]


@pytest.mark.anyio
async def test_select_sector_companies_orders_by_market_cap(monkeypatch):
    monkeypatch.setattr(
        bulletins,
        "load_us_universe",
        lambda: [
            {"symbol": "SMALL", "name": "Small Co", "sector": "Energy"},
            {"symbol": "BIG", "name": "Big Co", "sector": "Energy"},
            {"symbol": "NOCAP", "name": "No Cap", "sector": "Energy"},
            {"symbol": "OTHER", "name": "Other", "sector": "Technology"},
        ],
    )
    caps = {"SMALL": 1.0e9, "BIG": 5.0e11, "NOCAP": None}

    async def fake_fundamentals(symbol):
        return FundamentalsSnapshot(symbol=symbol, exchange="US", market_cap=caps[symbol])

    monkeypatch.setattr(bulletins, "get_us_fundamentals", fake_fundamentals)

    companies = await bulletins._select_sector_companies("Energy")

    assert [pick.symbol for pick, _ in companies] == ["BIG", "SMALL"]


def test_bulletin_prompt_carries_metrics_but_no_score_or_verdict():
    prompt = bulletins._build_bulletin_prompt(
        "Technology", [(Pick(symbol="AAPL", name="Apple Inc.", market_cap=3.0e12), APPLE)]
    )

    assert "3000.00 milyar USD" in prompt
    assert "F/K 30.00" in prompt
    for word in ("Al", "Sat", "Nötr", "skor", "öne çıkan"):
        assert word not in prompt
    assert "al, sat, tut" in bulletins.SYSTEM_PROMPT


@pytest.mark.anyio
async def test_generates_and_saves_new_bulletin(monkeypatch):
    monkeypatch.setattr(bulletins, "_get_bulletin_row", lambda d: None)

    picks = [Pick(symbol="AAPL", name="Apple Inc.", market_cap=3.0e12)]

    async def fake_select(sector):
        return [(picks[0], APPLE)]

    saved = {}

    def fake_save(bulletin_date, sector, picks_arg, content):
        saved["bulletin_date"] = bulletin_date
        saved["sector"] = sector
        saved["picks"] = picks_arg
        saved["content"] = content
        return Bulletin(
            bulletin_date=bulletin_date,
            sector=sector,
            picks=picks_arg,
            content=content,
            created_at=NOW,
        )

    async def fake_call_gemini(system_prompt, user_prompt, *, client=None):
        return "Bugünün bülteni."

    monkeypatch.setattr(bulletins, "_select_sector_companies", fake_select)
    monkeypatch.setattr(bulletins, "_save_bulletin", fake_save)
    monkeypatch.setattr(bulletins, "call_gemini", fake_call_gemini)

    result = await get_or_create_todays_bulletin()

    assert result.content.startswith("Bugünün bülteni.")
    assert saved["sector"] == pick_sector_for_date(date.today())
    assert saved["picks"] == picks


# --- _save_bulletin idempotency ---------------------------------------------------


def test_save_bulletin_handles_concurrent_insert_race(monkeypatch):
    call_count = {"n": 0}

    class FakeCursor:
        def execute(self, query, params=None):
            pass

        def fetchone(self):
            call_count["n"] += 1
            if call_count["n"] == 1:
                return None  # ON CONFLICT DO NOTHING -> no row from the INSERT
            return {
                "bulletin_date": date(2026, 1, 1),
                "sector": "Technology",
                "picks": [],
                "content": "Başka bir istek tarafından oluşturuldu",
                "created_at": NOW,
            }

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    class FakeConnection:
        def cursor(self, row_factory=None):
            return FakeCursor()

        def commit(self):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    @contextmanager
    def fake_get_connection():
        yield FakeConnection()

    monkeypatch.setattr(bulletins, "get_connection", fake_get_connection)

    result = bulletins._save_bulletin(date(2026, 1, 1), "Technology", [], "Benim içeriğim")

    assert result.content == "Başka bir istek tarafından oluşturuldu"


# --- endpoint ----------------------------------------------------------------------

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def override_auth():
    main.app.dependency_overrides[get_current_claims] = lambda: {"sub": "user-1"}
    yield
    main.app.dependency_overrides.pop(get_current_claims, None)


def test_get_bulletins_endpoint_returns_403_for_free_user(monkeypatch):
    def blocked(user_id):
        raise EntitlementLimitError("AI analiz raporları yalnızca premium katmanda kullanılabilir.")

    monkeypatch.setattr(main, "enforce_ai_reports_access", blocked)

    response = client.get("/bulletins")

    assert response.status_code == 403


def test_get_bulletins_endpoint_requires_auth():
    main.app.dependency_overrides.pop(get_current_claims, None)

    response = client.get("/bulletins")

    assert response.status_code == 401


def test_get_bulletins_endpoint_returns_list_for_premium_user(monkeypatch):
    monkeypatch.setattr(main, "enforce_ai_reports_access", lambda user_id: None)

    async def fake_get_or_create():
        return None

    monkeypatch.setattr(main, "get_or_create_todays_bulletin", fake_get_or_create)
    monkeypatch.setattr(main, "list_bulletins", lambda: [])

    response = client.get("/bulletins")

    assert response.status_code == 200
    assert response.json() == {"bulletins": [], "warnings": []}
