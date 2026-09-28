"""Story 13.1 — Finnhub data the daily scan needs beyond candles and fundamentals.

All endpoints were checked live with the project's Finnhub key on 2026-09-28
(docs/epics.md §17): company-news, stock/earnings, calendar/earnings and stock/filings are
available on the current plan; press-releases is not. stock/recommendation (analysts'
buy/sell counts) is available but deliberately never called (Story 12.1).

Every fetcher is best-effort: a failure returns an empty list, so one unavailable source
only removes its own event type from that day's scan instead of failing the symbol.
"""

import re
from datetime import UTC, date, datetime, timedelta

import httpx
from pydantic import BaseModel

from app.config import get_settings

FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
FINNHUB_TIMEOUT_SECONDS = 5.0
HEADLINE_LOOKBACK_HOURS = 48
MAX_HEADLINES = 3

# Third-party headlines such as "Which is the better stock to buy?" or "Analyst cuts price
# target" relay someone else's buy/sell call or price target; they are dropped rather than
# shown next to the user's holding (and never reach the AI note). Found in the first live
# run (2026-09-28): an NKE note repeated analysts' price-target cuts from headlines.
_DIRECTIVE_HEADLINE = re.compile(
    r"\b(buy|sell|should you|to watch|best stocks?|top stocks?|millionaire|forever|"
    r"price targets?|target price|upgrades?d?|downgrades?d?|outperform|underperform|"
    r"overweight|underweight|ratings?|reiterates?|initiates? coverage|upside|"
    r"(can|could|will|to) (double|triple)|multibagger|targets?|rall(y|ies)|bullish|bearish|"
    r"breakouts?|analysts?|what you should know|overdue|undervalued|overvalued)\b",
    re.IGNORECASE,
)


class Headline(BaseModel):
    headline: str
    source: str
    url: str
    published_at: datetime


async def _get(path: str, params: dict, client: httpx.AsyncClient) -> object | None:
    settings = get_settings()
    if not settings.finnhub_api_key:
        return None
    try:
        response = await client.get(
            f"{FINNHUB_BASE_URL}/{path}", params={**params, "token": settings.finnhub_api_key}
        )
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError):
        return None


async def fetch_earnings(symbol: str, client: httpx.AsyncClient) -> list[dict]:
    payload = await _get("stock/earnings", {"symbol": symbol}, client)
    return payload if isinstance(payload, list) else []


async def fetch_earnings_calendar(
    symbol: str, today: date, client: httpx.AsyncClient
) -> list[dict]:
    payload = await _get(
        "calendar/earnings",
        {
            "symbol": symbol,
            "from": today.isoformat(),
            "to": (today + timedelta(days=7)).isoformat(),
        },
        client,
    )
    if isinstance(payload, dict) and isinstance(payload.get("earningsCalendar"), list):
        return payload["earningsCalendar"]
    return []


async def fetch_filings(symbol: str, today: date, client: httpx.AsyncClient) -> list[dict]:
    payload = await _get(
        "stock/filings",
        {
            "symbol": symbol,
            "from": (today - timedelta(days=7)).isoformat(),
            "to": today.isoformat(),
        },
        client,
    )
    return payload if isinstance(payload, list) else []


_GENERIC_NAME_WORDS = {"the", "inc", "corp", "corporation", "company", "co", "group", "holdings"}


def _mentions_company(title: str, symbol: str, name: str | None) -> bool:
    """Finnhub's company-news also returns market round-ups and other companies' stories
    (first live run: Nvidia buyback news under AAPL). Keep headlines that name the company."""
    if len(symbol) >= 2 and re.search(rf"\b{re.escape(symbol)}\b", title):
        return True
    words = [w for w in re.findall(r"[A-Za-z][\w'&.-]*", name or "")]
    key = next(
        (w.strip(".,") for w in words if w.lower().strip(".,") not in _GENERIC_NAME_WORDS), ""
    )
    return len(key) >= 3 and re.search(rf"\b{re.escape(key)}", title, re.IGNORECASE) is not None


def select_headlines(
    items: list[dict], now: datetime, symbol: str = "", name: str | None = None
) -> list[Headline]:
    cutoff = now - timedelta(hours=HEADLINE_LOOKBACK_HOURS)
    selected: list[Headline] = []
    seen: set[str] = set()
    for item in sorted(items, key=lambda i: i.get("datetime") or 0, reverse=True):
        title = (item.get("headline") or "").strip()
        url = item.get("url") or ""
        stamp = item.get("datetime")
        if not title or not url.startswith("http") or not isinstance(stamp, int | float):
            continue
        published = datetime.fromtimestamp(stamp, tz=UTC)
        key = title.lower()
        if published < cutoff or key in seen or _DIRECTIVE_HEADLINE.search(title):
            continue
        if symbol and not _mentions_company(title, symbol, name):
            continue
        seen.add(key)
        selected.append(
            Headline(
                headline=title,
                source=(item.get("source") or "").strip() or "—",
                url=url,
                published_at=published,
            )
        )
        if len(selected) == MAX_HEADLINES:
            break
    return selected


async def fetch_headlines(
    symbol: str, now: datetime, client: httpx.AsyncClient, name: str | None = None
) -> list[Headline]:
    payload = await _get(
        "company-news",
        {
            "symbol": symbol,
            "from": (now - timedelta(hours=HEADLINE_LOOKBACK_HOURS)).date().isoformat(),
            "to": now.date().isoformat(),
        },
        client,
    )
    return select_headlines(payload if isinstance(payload, list) else [], now, symbol, name)
