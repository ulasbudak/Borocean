"""Story 14.2 — background evaluation of price and signal alerts.

Until now alerts were only evaluated when their owner opened the alerts page (GET /alerts),
so a push/email arrived while the user was already looking at it. Supabase pg_cron now calls
POST /internal/alerts/run (scripts/setup_alerts_cron.sql):
- kind=price  — every 15 minutes during the US session; quotes come from Finnhub (60/min).
- kind=signal — once a day after the US close; signals use daily candles from Twelve Data
  (8/min, shared with live users), so they are not polled more often.

Evaluation itself is unchanged (app/alerts.py, app/signal_alerts.py). Each symbol is
fetched once per run however many users watch it, and _mark_triggered() makes sure only one
of the page-load path and this run sends the notification.
"""

import asyncio
import logging

from app import alerts, signal_alerts

logger = logging.getLogger(__name__)

_running: dict[str, asyncio.Task] = {}


async def run_price_alerts() -> dict:
    owners = alerts.list_active_us_alerts_by_user()
    price_cache: dict[str, float | None] = {}
    triggered = 0
    for user_id, owner in owners.items():
        try:
            updated, _ = await alerts.evaluate_and_persist(
                owner["alerts"],
                user_id=user_id,
                email=owner["email"],
                locale=owner["locale"],
                price_cache=price_cache,
            )
            triggered += sum(1 for a in updated if a.status == "triggered")
        except Exception:
            logger.exception("price alert run failed for a user")
    result = {
        "users": len(owners),
        "symbols": len(price_cache),
        "unavailable": sum(1 for p in price_cache.values() if p is None),
        "triggered": triggered,
    }
    logger.info("price alert run: %s", result)
    return result


async def run_signal_alerts() -> dict:
    owners = signal_alerts.list_active_us_alerts_by_user()
    signal_cache: dict[tuple[str, str], list | None] = {}
    triggered = 0
    for user_id, owner in owners.items():
        try:
            updated, _ = await signal_alerts.evaluate_and_persist(
                owner["alerts"],
                user_id=user_id,
                email=owner["email"],
                locale=owner["locale"],
                signal_cache=signal_cache,
            )
            triggered += sum(1 for a in updated if a.status == "triggered")
        except Exception:
            logger.exception("signal alert run failed for a user")
    result = {"users": len(owners), "series": len(signal_cache), "triggered": triggered}
    logger.info("signal alert run: %s", result)
    return result


RUNNERS = {"price": run_price_alerts, "signal": run_signal_alerts}


def start_background_run(kind: str) -> bool:
    """Starts a run of `kind` in this process; False if one is already running."""
    task = _running.get(kind)
    if task is not None and not task.done():
        return False

    async def _run():
        try:
            await RUNNERS[kind]()
        except Exception:
            logger.exception("alert run %s crashed", kind)

    _running[kind] = asyncio.get_running_loop().create_task(_run())
    return True
