"""Story 12.2 — account deletion (KVKK right to erasure).

Every user-owned table references auth.users(id) ON DELETE CASCADE (migrations 0001-0011),
so deleting the auth user removes watchlists, alerts, portfolios, simulations, notes, saved
screens, notification settings and the entitlement row in one statement. The API's database
role (postgres, via SUPABASE_DB_URL) may delete from auth.users; no service-role key needed.
"""

import time
from collections import deque

from app.db import get_connection


def delete_account(user_id: str) -> bool:
    """Returns False if no such user existed (already deleted)."""
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM auth.users WHERE id = %s", (user_id,))
        deleted = cur.rowcount > 0
        conn.commit()
    return deleted


# --- "no account with this email" on the login screen (user request, 2026-10-09) ----------
#
# Supabase deliberately answers a wrong password and an unknown email the same way. The user
# asked the login screen to say "no account found" instead, which lets anyone test whether an
# address is registered. To keep that from being used to harvest addresses at scale, the
# check is rate-limited per address and globally (in-process; the API runs as one instance).
# When a limit is hit the answer is withheld (null), so the screen falls back to its generic
# message.

ACCOUNT_CHECK_PER_EMAIL = 5
ACCOUNT_CHECK_PER_EMAIL_WINDOW = 600.0
ACCOUNT_CHECK_GLOBAL = 120
ACCOUNT_CHECK_GLOBAL_WINDOW = 60.0

_checks_by_email: dict[str, deque[float]] = {}
_checks_global: deque[float] = deque()


def _allow(bucket: deque[float], limit: int, window: float, now: float) -> bool:
    while bucket and now - bucket[0] >= window:
        bucket.popleft()
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    return True


def account_check_allowed(email: str, now: float | None = None) -> bool:
    now = time.monotonic() if now is None else now
    if not _allow(_checks_global, ACCOUNT_CHECK_GLOBAL, ACCOUNT_CHECK_GLOBAL_WINDOW, now):
        return False
    _forget_quiet_addresses(now)
    bucket = _checks_by_email.setdefault(email, deque())
    return _allow(bucket, ACCOUNT_CHECK_PER_EMAIL, ACCOUNT_CHECK_PER_EMAIL_WINDOW, now)


def _forget_quiet_addresses(now: float) -> None:
    """Drop addresses whose last check is outside the window, so enumeration attempts can't
    grow the dict forever. The global limit caps live keys at about
    ACCOUNT_CHECK_GLOBAL * (per-email window / global window)."""
    if len(_checks_by_email) <= ACCOUNT_CHECK_GLOBAL:
        return
    stale = [
        email
        for email, bucket in _checks_by_email.items()
        if not bucket or now - bucket[-1] >= ACCOUNT_CHECK_PER_EMAIL_WINDOW
    ]
    for email in stale:
        del _checks_by_email[email]


def account_exists(email: str) -> bool:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM auth.users WHERE lower(email) = lower(%s) AND deleted_at IS NULL",
            (email,),
        )
        return cur.fetchone() is not None
