"""Daily sector bulletin (premium). Picks a sector by deterministic day-of-year
rotation, takes the sector's largest companies by market cap, and asks Gemini to
write an informational overview grounded in their public fundamental metrics.

Story 12.1 (SPK): the bulletin used to list the sector's five highest-*scoring*
stocks with their Al/Nötr/Sat labels — effectively "today's five stocks to buy,"
which is the textbook investment-advice case. Companies are now chosen by size (an
objective, non-evaluative criterion) and no score or label is attached to them.
Bulletins saved in the old format (picks carrying a "label") are hidden from the
list, and today's one is regenerated if it is still in the old format.

Unlike app/ai_reports.py's cache (one row per symbol, overwritten on refresh),
this is an APPEND-ONLY archive: one row per calendar day, never overwritten or
deleted (user requirement, 2026-09-18/19). `get_or_create_todays_bulletin()` is
the Story 9.1/9.2-style "generate on first request of the day" entry point.
"""

import asyncio
from datetime import date, datetime

from psycopg.rows import dict_row
from psycopg.types.json import Json
from pydantic import BaseModel

from app.ai_reports import (
    COMPLIANCE_RULES,
    DISCLAIMER_LINE,
    AIReportUnavailableError,
    call_gemini,
    ensure_disclaimer,
)
from app.db import get_connection
from app.fundamentals import FundamentalsSnapshot, get_us_fundamentals
from app.screener import load_us_universe

# Keep in sync with packages/shared/src/i18n/sectors.ts ALL_SECTORS — same Finnhub
# taxonomy used by apps/api/app/data/us_universe.json.
SECTORS = [
    "Technology",
    "Energy",
    "Healthcare",
    "Financial Services",
    "Consumer Cyclical",
    "Consumer Defensive",
    "Industrials",
    "Basic Materials",
    "Real Estate",
    "Utilities",
    "Communication Services",
]

MAX_CONCURRENT_FETCHES = 10
COMPANIES_PER_BULLETIN = 5
LIST_LIMIT = 30

SYSTEM_PROMPT = (
    "Sen Borocean uygulaması için bilgilendirme amaçlı sektör bülteni hazırlayan bir "
    "finansal veri editörüsün. Sana bir sektör adı ve o sektörün piyasa değerine göre en "
    "büyük birkaç şirketinin kamuya açık temel metrikleri verilecek. Türkçe, 2-4 "
    "paragraflık bir bülten yaz: sektörün genel metrik görünümü (kârlılık, borçluluk, "
    "değerleme aralıkları), şirketler arasındaki objektif farklar ve sektörü genel "
    "olarak etkileyebilecek risk türleri. Şirketleri çekicilik veya yatırıma uygunluk "
    "açısından sıralama ya da 'en iyi', 'öne çıkan' gibi ifadelerle öne çıkarma. "
    + COMPLIANCE_RULES
    + f" Bültenin sonunda ayrı bir satırda mutlaka şunu yaz: '{DISCLAIMER_LINE}'"
)


class Pick(BaseModel):
    """A company covered by the bulletin (kept as "Pick" for the stored JSON shape)."""

    symbol: str
    name: str
    market_cap: float | None = None


class Bulletin(BaseModel):
    bulletin_date: date
    sector: str
    picks: list[Pick]
    content: str
    created_at: datetime


def pick_sector_for_date(d: date) -> str:
    return SECTORS[d.timetuple().tm_yday % len(SECTORS)]


async def _select_sector_companies(
    sector: str,
) -> list[tuple[Pick, FundamentalsSnapshot]]:
    """The sector's largest companies by market cap, with their fundamentals."""
    universe = load_us_universe()
    candidates = [e for e in universe if e.get("sector") == sector]
    if not candidates:
        return []

    semaphore = asyncio.Semaphore(MAX_CONCURRENT_FETCHES)

    async def fetch_one(entry: dict):
        async with semaphore:
            try:
                fundamentals = await get_us_fundamentals(entry["symbol"])
            except Exception:
                return None
        if fundamentals.market_cap is None:
            return None
        pick = Pick(symbol=entry["symbol"], name=entry["name"], market_cap=fundamentals.market_cap)
        return pick, fundamentals

    results = await asyncio.gather(*(fetch_one(entry) for entry in candidates))
    companies = [r for r in results if r is not None]
    companies.sort(key=lambda r: r[0].market_cap or 0, reverse=True)
    return companies[:COMPANIES_PER_BULLETIN]


def _fmt(value: float | None, suffix: str = "") -> str:
    return "veri yok" if value is None else f"{value:.2f}{suffix}"


def _build_bulletin_prompt(
    sector: str, companies: list[tuple[Pick, FundamentalsSnapshot]]
) -> str:
    lines = [
        f"Sektör: {sector}",
        "",
        "Sektörün piyasa değerine göre en büyük şirketleri ve temel metrikleri:",
    ]
    for pick, f in companies:
        lines.append(
            f"- {pick.symbol} ({pick.name}): piyasa değeri "
            f"{_fmt(f.market_cap / 1e9 if f.market_cap else None)} milyar USD, "
            f"F/K {_fmt(f.pe_ratio)}, ROE {_fmt(f.roe, '%')}, net marj {_fmt(f.net_margin, '%')}, "
            f"borç/özsermaye {_fmt(f.debt_to_equity)}, EPS büyümesi {_fmt(f.eps_growth, '%')}"
        )
    return "\n".join(lines)


def _is_legacy_row(row: dict) -> bool:
    """Bulletins saved before Story 12.1 carry a score + Al/Nötr/Sat label per pick."""
    return any(isinstance(p, dict) and "label" in p for p in row["picks"])


def _row_to_bulletin(row: dict) -> Bulletin:
    return Bulletin(
        bulletin_date=row["bulletin_date"],
        sector=row["sector"],
        picks=[Pick(**p) for p in row["picks"]],
        content=row["content"],
        created_at=row["created_at"],
    )


def _get_bulletin_row(bulletin_date: date) -> dict | None:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT bulletin_date, sector, picks, content, created_at "
            "FROM sector_bulletins WHERE bulletin_date = %s",
            (bulletin_date,),
        )
        return cur.fetchone()


def _replace_legacy_bulletin(
    bulletin_date: date, sector: str, picks: list[Pick], content: str
) -> Bulletin:
    """Overwrites today's row only if it is still in the pre-12.1 format."""
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            UPDATE sector_bulletins
            SET sector = %s, picks = %s, content = %s, created_at = now()
            WHERE bulletin_date = %s
            RETURNING bulletin_date, sector, picks, content, created_at
            """,
            (sector, Json([p.model_dump() for p in picks]), content, bulletin_date),
        )
        row = cur.fetchone()
        conn.commit()
    return _row_to_bulletin(row)


def _save_bulletin(bulletin_date: date, sector: str, picks: list[Pick], content: str) -> Bulletin:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO sector_bulletins (bulletin_date, sector, picks, content)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (bulletin_date) DO NOTHING
            RETURNING bulletin_date, sector, picks, content, created_at
            """,
            (bulletin_date, sector, Json([p.model_dump() for p in picks]), content),
        )
        row = cur.fetchone()
        if row is None:
            # Another request already inserted today's bulletin between our check
            # and this insert — read what they wrote instead of erroring.
            cur.execute(
                "SELECT bulletin_date, sector, picks, content, created_at "
                "FROM sector_bulletins WHERE bulletin_date = %s",
                (bulletin_date,),
            )
            row = cur.fetchone()
        conn.commit()
    return _row_to_bulletin(row)


def list_bulletins(limit: int = LIST_LIMIT) -> list[Bulletin]:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT bulletin_date, sector, picks, content, created_at "
            "FROM sector_bulletins ORDER BY bulletin_date DESC LIMIT %s",
            (limit,),
        )
        rows = cur.fetchall()
    return [_row_to_bulletin(row) for row in rows if not _is_legacy_row(row)]


async def get_or_create_todays_bulletin() -> Bulletin:
    today = date.today()
    existing = _get_bulletin_row(today)
    if existing is not None and not _is_legacy_row(existing):
        return _row_to_bulletin(existing)

    sector = pick_sector_for_date(today)
    companies = await _select_sector_companies(sector)
    if not companies:
        raise AIReportUnavailableError(f"{sector} sektörü için bugün yeterli veri yok.")

    user_prompt = _build_bulletin_prompt(sector, companies)
    content = ensure_disclaimer(await call_gemini(SYSTEM_PROMPT, user_prompt))
    picks = [pick for pick, _ in companies]

    if existing is not None:
        return _replace_legacy_bulletin(today, sector, picks, content)
    return _save_bulletin(today, sector, picks, content)
