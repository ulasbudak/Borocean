"""Story 12.2 — account deletion (KVKK right to erasure).

Every user-owned table references auth.users(id) ON DELETE CASCADE (migrations 0001-0011),
so deleting the auth user removes watchlists, alerts, portfolios, simulations, notes, saved
screens, notification settings and the entitlement row in one statement. The API's database
role (postgres, via SUPABASE_DB_URL) may delete from auth.users; no service-role key needed.
"""

from app.db import get_connection


def delete_account(user_id: str) -> bool:
    """Returns False if no such user existed (already deleted)."""
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM auth.users WHERE id = %s", (user_id,))
        deleted = cur.rowcount > 0
        conn.commit()
    return deleted
