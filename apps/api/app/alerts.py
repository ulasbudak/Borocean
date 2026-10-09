from datetime import UTC, datetime

from psycopg.rows import dict_row
from pydantic import BaseModel

from app.db import get_connection
from app.market_data import MarketDataUnavailableError, get_us_overview
from app.notifications import notify_trigger

UNAVAILABLE_WARNING = "ABD alarmları şu an değerlendirilemiyor."


class AlertNotFoundError(Exception):
    """Raised when a price alert does not exist or does not belong to the requesting user."""


class PriceAlert(BaseModel):
    id: str
    symbol: str
    exchange: str
    name: str | None = None
    direction: str
    threshold: float
    status: str
    created_at: datetime
    triggered_at: datetime | None = None
    unavailable: bool = False


def _row_to_alert(row: dict) -> PriceAlert:
    return PriceAlert(
        id=str(row["id"]),
        symbol=row["symbol"],
        exchange=row["exchange"],
        name=row["name"],
        direction=row["direction"],
        threshold=float(row["threshold"]),
        status=row["status"],
        created_at=row["created_at"],
        triggered_at=row["triggered_at"],
    )


def list_alerts(user_id: str) -> list[PriceAlert]:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, symbol, exchange, name, direction, threshold, status, created_at, "
            "triggered_at FROM price_alerts WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,),
        )
        return [_row_to_alert(row) for row in cur.fetchall()]


def create_alert(
    user_id: str,
    *,
    symbol: str,
    exchange: str,
    name: str | None,
    direction: str,
    threshold: float,
) -> PriceAlert:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO price_alerts (user_id, symbol, exchange, name, direction, threshold)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, symbol, exchange, name, direction, threshold, status, created_at,
                      triggered_at
            """,
            (user_id, symbol.upper(), exchange.upper(), name, direction, threshold),
        )
        row = cur.fetchone()
        conn.commit()
    return _row_to_alert(row)


def delete_alert(user_id: str, alert_id: str) -> None:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM price_alerts WHERE id = %s AND user_id = %s",
            (alert_id, user_id),
        )
        deleted = cur.rowcount
        conn.commit()
    if deleted == 0:
        raise AlertNotFoundError(alert_id)


def _mark_triggered(alert_id: str) -> bool:
    """True only for the call that actually moved the alert to triggered. The page-load
    path (GET /alerts) and the background run (Story 14.2) can evaluate the same alert at
    the same time; only the winner sends the notification."""
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE price_alerts SET status = 'triggered', triggered_at = now() "
            "WHERE id = %s AND status = 'active'",
            (alert_id,),
        )
        changed = cur.rowcount > 0
        conn.commit()
    return changed


def list_active_us_alerts_by_user() -> dict[str, dict]:
    """All active US price alerts grouped by owner, with the owner's email and locale
    (Story 14.2 background run)."""
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT a.id, a.symbol, a.exchange, a.name, a.direction, a.threshold, a.status,
                   a.created_at, a.triggered_at, a.user_id, u.email,
                   coalesce(u.raw_user_meta_data->>'locale', 'tr') AS locale
            FROM price_alerts a JOIN auth.users u ON u.id = a.user_id
            WHERE a.status = 'active' AND a.exchange = 'US'
            """
        )
        rows = cur.fetchall()
    owners: dict[str, dict] = {}
    for row in rows:
        owner = owners.setdefault(
            str(row["user_id"]), {"email": row["email"], "locale": row["locale"], "alerts": []}
        )
        owner["alerts"].append(_row_to_alert(row))
    return owners


def price_alert_message(alert: PriceAlert, locale: str) -> tuple[str, str]:
    label = alert.name or alert.symbol
    above = alert.direction == "above"
    if locale == "en":
        return (
            "Borocean price alert",
            f"{label} ({alert.symbol}) {'rose above' if above else 'fell below'} "
            f"{alert.threshold}.",
        )
    return (
        "Borocean Fiyat Alarmı",
        f"{label} ({alert.symbol}) {alert.threshold} seviyesinin "
        f"{'üstüne yükseldi' if above else 'altına düştü'}.",
    )


def _condition_met(direction: str, threshold: float, price: float) -> bool:
    if direction == "above":
        return price >= threshold
    return price <= threshold


async def evaluate_and_persist(
    alerts: list[PriceAlert],
    *,
    user_id: str | None = None,
    email: str | None = None,
    locale: str = "tr",
    price_cache: dict[str, float | None] | None = None,
) -> tuple[list[PriceAlert], list[str]]:
    """Check active US alerts against the latest price and persist any that just triggered.

    BIST alerts are never evaluated (no live price source yet, see docs/architecture.md
    §11) and come back flagged `unavailable=True` rather than silently staying "active"
    forever with no way to ever trigger.

    If `user_id` is given, a best-effort push/email notification (Story 5.4) is fired for
    every alert that transitions to `triggered` during this call.
    """
    warnings: list[str] = []
    # Shared across users by the background run, so each symbol is quoted once per run.
    price_cache = {} if price_cache is None else price_cache
    updated: list[PriceAlert] = []

    for alert in alerts:
        if alert.exchange == "BIST":
            updated.append(alert.model_copy(update={"unavailable": True}))
            continue

        if alert.status != "active":
            updated.append(alert)
            continue

        if alert.symbol not in price_cache:
            try:
                overview = await get_us_overview(alert.symbol)
                price_cache[alert.symbol] = overview.price
            except MarketDataUnavailableError:
                price_cache[alert.symbol] = None

        price = price_cache[alert.symbol]
        if price is None:
            updated.append(alert.model_copy(update={"unavailable": True}))
            if UNAVAILABLE_WARNING not in warnings:
                warnings.append(UNAVAILABLE_WARNING)
            continue

        if _condition_met(alert.direction, alert.threshold, price):
            won = _mark_triggered(alert.id)
            updated.append(
                alert.model_copy(update={"status": "triggered", "triggered_at": datetime.now(UTC)})
            )
            if user_id is not None and won:
                title, body = price_alert_message(alert, locale)
                await notify_trigger(user_id, email, title, body, locale=locale)
        else:
            updated.append(alert)

    return updated, warnings
