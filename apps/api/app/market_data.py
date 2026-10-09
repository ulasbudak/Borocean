import asyncio
import contextlib
import difflib
import json
import time
from collections import deque
from collections.abc import Iterator
from contextvars import ContextVar
from datetime import UTC, date, datetime
from functools import lru_cache
from pathlib import Path

import httpx
from pydantic import BaseModel

from app.config import get_settings

BIST_SYMBOLS_PATH = Path(__file__).parent / "data" / "bist_symbols.json"

# Product decision (2026-09-26): Borsa İstanbul is switched off until a live BIST price
# source exists — without prices, charts, signals, screening, simulation and AI reports,
# BIST symbols only led users to empty pages. While False, search and the screener skip
# BIST, and BIST endpoints answer with BIST_DISABLED_MESSAGE. The frontends mirror this
# with BIST_ENABLED in @borocean/shared; flip both to re-enable.
BIST_ENABLED = False
BIST_DISABLED_MESSAGE = (
    "Borsa İstanbul (BIST) şu an devre dışı; şimdilik yalnızca ABD borsaları destekleniyor."
)
FINNHUB_SEARCH_URL = "https://finnhub.io/api/v1/search"
FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote"
FINNHUB_PROFILE_URL = "https://finnhub.io/api/v1/stock/profile2"
FINNHUB_TIMEOUT_SECONDS = 3.0
MAX_RESULTS = 20
FUZZY_MATCH_CUTOFF = 0.6

# Finnhub's free tier no longer grants access to /stock/candle for US symbols
# ("You don't have access to this resource"), so historical OHLC comes from Twelve Data instead.
TWELVEDATA_TIME_SERIES_URL = "https://api.twelvedata.com/time_series"
TWELVEDATA_TIMEOUT_SECONDS = 5.0
TWELVEDATA_RATE_LIMIT_PER_MINUTE = 8

FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
# Free tier is 60/min. Keep headroom, and stop background jobs earlier so users' requests
# always find budget left (AD-5).
FINNHUB_RATE_LIMIT_PER_MINUTE = 55
FINNHUB_BACKGROUND_LIMIT_PER_MINUTE = 40
TWELVEDATA_DAILY_LIMIT = 800
# A user-facing call gives up instead of hanging the page; background jobs just wait.
INTERACTIVE_MAX_WAIT_SECONDS = 20.0

QUOTE_CACHE_SECONDS = 60.0
PROFILE_CACHE_SECONDS = 24 * 3600.0
_CACHE_MAX_ENTRIES = 2000

# Which lane provider calls in the current task draw from. Runners and other jobs that fan
# out set "background" for their whole task via `background_lane()`.
provider_lane: ContextVar[str] = ContextVar("provider_lane", default="interactive")


@contextlib.contextmanager
def background_lane() -> Iterator[None]:
    token = provider_lane.set("background")
    try:
        yield
    finally:
        provider_lane.reset(token)


class ProviderBudgetExceededError(httpx.HTTPError):
    """Our own request budget for a provider is spent. Subclasses httpx.HTTPError so every
    caller's existing "provider unavailable" handling covers it."""


class _RateBudget:
    """Process-wide sliding-window request budget for one provider (AD-5)."""

    def __init__(
        self,
        name: str,
        per_minute: int,
        *,
        background_per_minute: int | None = None,
        per_day: int | None = None,
    ) -> None:
        self.name = name
        self.per_minute = per_minute
        self.background_per_minute = background_per_minute or per_minute
        self.per_day = per_day
        self._calls: deque[float] = deque()
        self._day: date | None = None
        self._day_count = 0
        self._lock = asyncio.Lock()

    def reset(self) -> None:
        self._calls.clear()
        self._day = None
        self._day_count = 0

    async def acquire(self) -> None:
        background = provider_lane.get() == "background"
        limit = self.background_per_minute if background else self.per_minute
        waited = 0.0
        while True:
            async with self._lock:
                now = time.monotonic()
                while self._calls and now - self._calls[0] >= 60.0:
                    self._calls.popleft()
                today = datetime.now(UTC).date()
                if self._day != today:
                    self._day, self._day_count = today, 0
                if self.per_day is not None and self._day_count >= self.per_day:
                    raise ProviderBudgetExceededError(f"{self.name} daily request budget spent")
                if len(self._calls) < limit:
                    self._calls.append(now)
                    self._day_count += 1
                    return
                if limit <= 0:
                    raise ProviderBudgetExceededError(f"{self.name} has no request budget")
                wait = 60.0 - (now - self._calls[len(self._calls) - limit]) + 0.05
            if not background and waited + wait > INTERACTIVE_MAX_WAIT_SECONDS:
                raise ProviderBudgetExceededError(f"{self.name} per-minute request budget spent")
            await asyncio.sleep(wait)
            waited += wait


FINNHUB_BUDGET = _RateBudget(
    "Finnhub",
    FINNHUB_RATE_LIMIT_PER_MINUTE,
    background_per_minute=FINNHUB_BACKGROUND_LIMIT_PER_MINUTE,
)
TWELVEDATA_BUDGET = _RateBudget(
    "Twelve Data", TWELVEDATA_RATE_LIMIT_PER_MINUTE, per_day=TWELVEDATA_DAILY_LIMIT
)


async def finnhub_get(
    client: httpx.AsyncClient, path: str, params: dict
) -> httpx.Response:
    """The only way the app calls Finnhub (AD-5): draws on the shared budget and adds the
    token. Raises httpx errors like a plain `client.get`, so callers keep their handling."""
    await FINNHUB_BUDGET.acquire()
    url = path if path.startswith("http") else f"{FINNHUB_BASE_URL}/{path}"
    return await client.get(url, params={**params, "token": get_settings().finnhub_api_key})


class _TTLCache:
    def __init__(self, ttl_seconds: float) -> None:
        self.ttl = ttl_seconds
        self._items: dict[tuple, tuple[float, object]] = {}

    def get(self, key: tuple):
        hit = self._items.get(key)
        if hit is None or time.monotonic() - hit[0] > self.ttl:
            return None
        return hit[1]

    def put(self, key: tuple, value: object) -> None:
        if len(self._items) >= _CACHE_MAX_ENTRIES:
            now = time.monotonic()
            self._items = {k: v for k, v in self._items.items() if now - v[0] <= self.ttl}
            if len(self._items) >= _CACHE_MAX_ENTRIES:
                self._items.clear()
        self._items[key] = (time.monotonic(), value)

    def clear(self) -> None:
        self._items.clear()


# Keyed by (symbol, exchange) per AD-5.
_quote_cache = _TTLCache(QUOTE_CACHE_SECONDS)
_profile_cache = _TTLCache(PROFILE_CACHE_SECONDS)


def reset_provider_state() -> None:
    """Test hook: forget budgets and cached quotes/profiles."""
    FINNHUB_BUDGET.reset()
    TWELVEDATA_BUDGET.reset()
    _quote_cache.clear()
    _profile_cache.clear()


TIMEFRAMES: dict[str, dict[str, object]] = {
    "intraday": {"interval": "1h", "outputsize": 40},
    "daily": {"interval": "1day", "outputsize": 260},
    "weekly": {"interval": "1week", "outputsize": 260},
    "monthly": {"interval": "1month", "outputsize": 240},
}


class SymbolResult(BaseModel):
    symbol: str
    name: str
    exchange: str


class StockOverview(BaseModel):
    symbol: str
    exchange: str
    name: str
    price: float | None = None
    change_abs: float | None = None
    change_pct: float | None = None
    market_cap: float | None = None
    currency: str | None = None
    sector: str | None = None
    industry: str | None = None


class CandlePoint(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float | None = None


class FinnhubError(Exception):
    """Raised when the Finnhub symbol search cannot be completed."""


class MarketDataUnavailableError(Exception):
    """Raised when overview data cannot be retrieved for a symbol."""


@lru_cache
def load_bist_symbols() -> list[dict[str, str]]:
    with BIST_SYMBOLS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def search_bist_symbols(
    query: str, entries: list[dict[str, str]] | None = None
) -> list[SymbolResult]:
    normalized = query.strip().lower()
    if not normalized:
        return []

    candidates = entries if entries is not None else load_bist_symbols()

    prefix_matches = [e for e in candidates if e["symbol"].lower().startswith(normalized)]
    substring_matches = [
        e
        for e in candidates
        if e not in prefix_matches and normalized in e["name"].lower()
    ]
    ordered = prefix_matches + substring_matches

    if not ordered:
        symbol_pool = {e["symbol"].lower(): e for e in candidates}
        name_pool = {e["name"].lower(): e for e in candidates}
        close_symbols = difflib.get_close_matches(
            normalized, symbol_pool.keys(), n=MAX_RESULTS, cutoff=FUZZY_MATCH_CUTOFF
        )
        close_names = difflib.get_close_matches(
            normalized, name_pool.keys(), n=MAX_RESULTS, cutoff=FUZZY_MATCH_CUTOFF
        )
        seen_symbols = set()
        for key in close_symbols:
            entry = symbol_pool[key]
            if entry["symbol"] not in seen_symbols:
                ordered.append(entry)
                seen_symbols.add(entry["symbol"])
        for key in close_names:
            entry = name_pool[key]
            if entry["symbol"] not in seen_symbols:
                ordered.append(entry)
                seen_symbols.add(entry["symbol"])

    return [
        SymbolResult(symbol=e["symbol"], name=e["name"], exchange="BIST")
        for e in ordered[:MAX_RESULTS]
    ]


async def search_us_symbols(
    query: str, *, client: httpx.AsyncClient | None = None
) -> list[SymbolResult]:
    settings = get_settings()
    if not settings.finnhub_api_key:
        raise FinnhubError("FINNHUB_API_KEY is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=FINNHUB_TIMEOUT_SECONDS)
    try:
        response = await finnhub_get(
            http_client,
            FINNHUB_SEARCH_URL,
            # Without exchange=US, Finnhub also returns foreign listings (AAPL.TO, MSFT.L,
            # GARAN.E.IS…) that we'd label "US" but have no data for.
            {"q": query, "exchange": "US"},
        )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError as exc:
        raise FinnhubError(f"Finnhub request failed: {exc}") from exc
    finally:
        if owns_client:
            await http_client.aclose()

    results = []
    for item in payload.get("result", [])[:MAX_RESULTS]:
        symbol = item.get("symbol")
        name = item.get("description")
        if not symbol or not name:
            continue
        results.append(SymbolResult(symbol=symbol, name=name, exchange="US"))
    return results


def get_bist_overview(symbol: str) -> StockOverview:
    normalized = symbol.strip().upper()
    entries = load_bist_symbols()
    match = next((e for e in entries if e["symbol"].upper() == normalized), None)
    return StockOverview(
        symbol=normalized,
        exchange="BIST",
        name=match["name"] if match else normalized,
    )


async def get_us_overview(
    symbol: str, *, client: httpx.AsyncClient | None = None
) -> StockOverview:
    settings = get_settings()
    if not settings.finnhub_api_key:
        raise MarketDataUnavailableError("FINNHUB_API_KEY is not configured")

    key = (symbol.upper(), "US")
    quote = _quote_cache.get(key)
    profile = _profile_cache.get(key)

    async def fetch_json(url: str) -> dict:
        response = await finnhub_get(http_client, url, {"symbol": symbol})
        response.raise_for_status()
        return response.json()

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=FINNHUB_TIMEOUT_SECONDS)
    try:
        if quote is None and profile is None:
            quote, profile = await asyncio.gather(
                fetch_json(FINNHUB_QUOTE_URL), fetch_json(FINNHUB_PROFILE_URL)
            )
        elif quote is None:
            quote = await fetch_json(FINNHUB_QUOTE_URL)
        elif profile is None:
            profile = await fetch_json(FINNHUB_PROFILE_URL)
    except httpx.HTTPError as exc:
        raise MarketDataUnavailableError(f"Finnhub request failed: {exc}") from exc
    finally:
        if owns_client:
            await http_client.aclose()

    price = quote.get("c")
    previous_close = quote.get("pc")
    if not price and not previous_close:
        raise MarketDataUnavailableError(f"No quote data for symbol {symbol}")
    _quote_cache.put(key, quote)
    if profile:
        _profile_cache.put(key, profile)

    market_cap = profile.get("marketCapitalization")

    return StockOverview(
        symbol=symbol.upper(),
        exchange="US",
        name=profile.get("name") or symbol.upper(),
        price=price,
        change_abs=quote.get("d"),
        change_pct=quote.get("dp"),
        market_cap=market_cap * 1_000_000 if market_cap else None,
        currency=profile.get("currency"),
        sector=profile.get("finnhubIndustry"),
        industry=None,
    )


def get_bist_candles(symbol: str, timeframe: str) -> list[CandlePoint]:
    return []


def _parse_twelvedata_timestamp(value: str) -> int:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return int(datetime.strptime(value, fmt).replace(tzinfo=UTC).timestamp())
        except ValueError:
            continue
    raise ValueError(f"Unrecognized Twelve Data datetime: {value}")


async def get_us_candles(
    symbol: str, timeframe: str, *, client: httpx.AsyncClient | None = None
) -> list[CandlePoint]:
    settings = get_settings()
    if not settings.twelvedata_api_key:
        raise MarketDataUnavailableError("TWELVEDATA_API_KEY is not configured")

    config = TIMEFRAMES[timeframe]

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=TWELVEDATA_TIMEOUT_SECONDS)
    try:
        await TWELVEDATA_BUDGET.acquire()
        response = await http_client.get(
            TWELVEDATA_TIME_SERIES_URL,
            params={
                "symbol": symbol,
                "interval": config["interval"],
                "outputsize": config["outputsize"],
                "apikey": settings.twelvedata_api_key,
            },
        )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError as exc:
        raise MarketDataUnavailableError(f"Twelve Data request failed: {exc}") from exc
    finally:
        if owns_client:
            await http_client.aclose()

    values = payload.get("values")
    if payload.get("status") != "ok" or not values:
        raise MarketDataUnavailableError(f"No candle data for symbol {symbol}")

    # Twelve Data returns newest-first; the app's indicators expect chronological order.
    return [
        CandlePoint(
            time=_parse_twelvedata_timestamp(v["datetime"]),
            open=float(v["open"]),
            high=float(v["high"]),
            low=float(v["low"]),
            close=float(v["close"]),
            volume=float(v["volume"]) if v.get("volume") is not None else None,
        )
        for v in reversed(values)
    ]
