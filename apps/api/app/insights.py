"""Epic 13 — data layer for portfolio insights (migration 0013_portfolio_insights.sql).

Generation is global (one `symbol_insights` row per symbol per day, shared by everyone who
holds it); display is personal (joined with the user's positions, read state per user).
"""

from datetime import date, datetime, timedelta

from psycopg.rows import dict_row
from psycopg.types.json import Json
from pydantic import BaseModel

from app.db import get_connection

# A "running" run older than this is considered dead (e.g. the process restarted mid-run)
# and no longer blocks a new one.
STALE_RUN_AFTER = timedelta(hours=2)
PORTFOLIO_WINDOW_DAYS = 7
SYMBOL_WINDOW_DAYS = 30


class ScanState(BaseModel):
    last_scanned_date: date
    last_candle_date: date | None = None
    last_earnings_period: str | None = None
    fundamentals: dict | None = None


class Insight(BaseModel):
    id: str
    symbol: str
    exchange: str
    name: str | None = None
    insight_date: date
    severity: int
    events: list[dict]
    headlines: list[dict]
    note: str | None = None
    note_tone: str | None = None
    note_locked: bool = False
    read: bool = False
    created_at: datetime


class InsightRun(BaseModel):
    id: str
    run_date: date
    trigger: str
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    universe_size: int = 0
    processed: int = 0
    skipped: int = 0
    important: int = 0
    failed: int = 0
    notes_generated: int = 0
    pushes_sent: int = 0


# --- scan state -------------------------------------------------------------------------


def get_scan_state(symbol: str, exchange: str) -> ScanState | None:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT last_scanned_date, last_candle_date, last_earnings_period, fundamentals "
            "FROM symbol_scan_state WHERE symbol = %s AND exchange = %s",
            (symbol, exchange),
        )
        row = cur.fetchone()
    return ScanState(**row) if row else None


def save_scan_state(symbol: str, exchange: str, state: ScanState) -> None:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO symbol_scan_state
                (symbol, exchange, last_scanned_date, last_candle_date,
                 last_earnings_period, fundamentals, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (symbol, exchange) DO UPDATE SET
                last_scanned_date = EXCLUDED.last_scanned_date,
                last_candle_date = EXCLUDED.last_candle_date,
                last_earnings_period = EXCLUDED.last_earnings_period,
                fundamentals = EXCLUDED.fundamentals,
                updated_at = now()
            """,
            (
                symbol,
                exchange,
                state.last_scanned_date,
                state.last_candle_date,
                state.last_earnings_period,
                Json(state.fundamentals) if state.fundamentals is not None else None,
            ),
        )
        conn.commit()


# --- insights ---------------------------------------------------------------------------


def save_insight(
    symbol: str,
    exchange: str,
    insight_date: date,
    severity: int,
    events: list[dict],
    headlines: list[dict],
) -> str:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO symbol_insights
                (symbol, exchange, insight_date, severity, events, headlines)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (symbol, exchange, insight_date) DO UPDATE SET
                severity = EXCLUDED.severity,
                events = EXCLUDED.events,
                headlines = EXCLUDED.headlines
            RETURNING id
            """,
            (symbol, exchange, insight_date, severity, Json(events), Json(headlines)),
        )
        insight_id = cur.fetchone()[0]
        conn.commit()
    return str(insight_id)


def save_insight_note(insight_id: str, note: str, tone: str | None, prompt_version: int) -> None:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE symbol_insights SET note = %s, note_tone = %s, prompt_version = %s "
            "WHERE id = %s",
            (note, tone, prompt_version, insight_id),
        )
        conn.commit()


def count_notes_on(insight_date: date) -> int:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT count(*) FROM symbol_insights WHERE insight_date = %s AND note IS NOT NULL",
            (insight_date,),
        )
        return cur.fetchone()[0]


def _row_to_insight(row: dict) -> Insight:
    return Insight(
        id=str(row["id"]),
        symbol=row["symbol"],
        exchange=row["exchange"],
        name=row.get("name"),
        insight_date=row["insight_date"],
        severity=row["severity"],
        events=row["events"] or [],
        headlines=row["headlines"] or [],
        note=row["note"],
        note_tone=row["note_tone"],
        read=bool(row.get("read", False)),
        created_at=row["created_at"],
    )


_INSIGHT_COLUMNS = (
    "i.id, i.symbol, i.exchange, i.insight_date, i.severity, i.events, i.headlines, "
    "i.note, i.note_tone, i.created_at"
)


def list_portfolio_insights(user_id: str, today: date) -> list[Insight]:
    """Insights of the last 7 days for symbols the user currently holds, newest first."""
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            f"""
            WITH held AS (
                SELECT p.symbol, p.exchange, max(p.name) AS name
                FROM positions p
                JOIN portfolios pf ON pf.id = p.portfolio_id
                WHERE pf.user_id = %s
                GROUP BY p.symbol, p.exchange
            )
            SELECT {_INSIGHT_COLUMNS}, held.name,
                   (r.user_id IS NOT NULL) AS read
            FROM symbol_insights i
            JOIN held ON held.symbol = i.symbol AND held.exchange = i.exchange
            LEFT JOIN insight_reads r ON r.insight_id = i.id AND r.user_id = %s
            WHERE i.insight_date > %s
            ORDER BY i.insight_date DESC, i.severity DESC, i.symbol
            """,
            (user_id, user_id, today - timedelta(days=PORTFOLIO_WINDOW_DAYS)),
        )
        return [_row_to_insight(row) for row in cur.fetchall()]


def list_symbol_insights(user_id: str, symbol: str, exchange: str, today: date) -> list[Insight]:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            f"""
            SELECT {_INSIGHT_COLUMNS}, (r.user_id IS NOT NULL) AS read
            FROM symbol_insights i
            LEFT JOIN insight_reads r ON r.insight_id = i.id AND r.user_id = %s
            WHERE i.symbol = %s AND i.exchange = %s AND i.insight_date > %s
            ORDER BY i.insight_date DESC
            """,
            (user_id, symbol, exchange, today - timedelta(days=SYMBOL_WINDOW_DAYS)),
        )
        return [_row_to_insight(row) for row in cur.fetchall()]


def user_holds_positions(user_id: str) -> bool:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM positions p JOIN portfolios pf ON pf.id = p.portfolio_id "
            "WHERE pf.user_id = %s LIMIT 1",
            (user_id,),
        )
        return cur.fetchone() is not None


def mark_read(user_id: str, insight_ids: list[str]) -> None:
    if not insight_ids:
        return
    with get_connection() as conn, conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO insight_reads (user_id, insight_id) VALUES (%s, %s) "
            "ON CONFLICT DO NOTHING",
            [(user_id, insight_id) for insight_id in insight_ids],
        )
        conn.commit()


# --- scan universe ----------------------------------------------------------------------


def portfolio_universe(limit: int) -> list[tuple[str, str | None]]:
    """Distinct US symbols held in any portfolio (with a company name), most-held first."""
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT p.symbol, max(p.name)
            FROM positions p
            JOIN portfolios pf ON pf.id = p.portfolio_id
            WHERE p.exchange = 'US'
            GROUP BY p.symbol
            ORDER BY count(DISTINCT pf.user_id) DESC, p.symbol
            LIMIT %s
            """,
            (limit,),
        )
        return [(row[0], row[1]) for row in cur.fetchall()]


def insights_missing_note(insight_date: date) -> list[dict]:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, symbol, events, headlines FROM symbol_insights "
            "WHERE insight_date = %s AND note IS NULL ORDER BY severity DESC, symbol",
            (insight_date,),
        )
        return cur.fetchall()


# --- runs -------------------------------------------------------------------------------


def start_run(run_date: date, trigger: str, now: datetime) -> str | None:
    """Creates a run row, or returns None if a live run for the same day already exists."""
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(hashtext('insight_runs'))")
        cur.execute(
            "SELECT 1 FROM insight_runs WHERE run_date = %s AND status = 'running' "
            "AND started_at > %s",
            (run_date, now - STALE_RUN_AFTER),
        )
        if cur.fetchone():
            conn.commit()
            return None
        cur.execute(
            "UPDATE insight_runs SET status = 'failed', finished_at = now(), "
            "error = 'stale: process stopped before finishing' "
            "WHERE status = 'running' AND started_at <= %s",
            (now - STALE_RUN_AFTER,),
        )
        cur.execute(
            "INSERT INTO insight_runs (run_date, trigger) VALUES (%s, %s) RETURNING id",
            (run_date, trigger),
        )
        run_id = cur.fetchone()[0]
        conn.commit()
    return str(run_id)


def finish_run(run_id: str, counters: dict, status: str, error: str | None = None) -> None:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE insight_runs SET
                status = %s, finished_at = now(), error = %s,
                universe_size = %s, processed = %s, skipped = %s, important = %s,
                failed = %s, notes_generated = %s, pushes_sent = %s
            WHERE id = %s
            """,
            (
                status,
                error,
                counters.get("universe_size", 0),
                counters.get("processed", 0),
                counters.get("skipped", 0),
                counters.get("important", 0),
                counters.get("failed", 0),
                counters.get("notes_generated", 0),
                counters.get("pushes_sent", 0),
                run_id,
            ),
        )
        conn.commit()


def latest_run(run_date: date) -> InsightRun | None:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT * FROM insight_runs WHERE run_date = %s ORDER BY started_at DESC LIMIT 1",
            (run_date,),
        )
        row = cur.fetchone()
    if row is None:
        return None
    row = {k: v for k, v in row.items() if k != "error"}
    return InsightRun(**{**row, "id": str(row["id"])})


# --- push (Story 13.6) ------------------------------------------------------------------


def push_recipients(insight_date: date) -> list[dict]:
    """Users with push on and a device token who hold a symbol with an insight today and
    haven't been pushed today. One row per (user, insight)."""
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT DISTINCT pf.user_id, s.expo_push_token AS token,
                   coalesce(u.raw_user_meta_data->>'locale', 'tr') AS locale,
                   i.symbol, i.severity, i.events
            FROM symbol_insights i
            JOIN positions p ON p.symbol = i.symbol AND p.exchange = i.exchange
            JOIN portfolios pf ON pf.id = p.portfolio_id
            JOIN user_notification_settings s ON s.user_id = pf.user_id
            JOIN auth.users u ON u.id = pf.user_id
            LEFT JOIN insight_push_log l
                ON l.user_id = pf.user_id AND l.push_date = i.insight_date
            WHERE i.insight_date = %s
              AND s.push_enabled AND s.expo_push_token IS NOT NULL
              AND l.user_id IS NULL
            ORDER BY pf.user_id, i.severity DESC, i.symbol
            """,
            (insight_date,),
        )
        return cur.fetchall()


def log_push(user_id: str, push_date: date) -> bool:
    """Returns False if this user was already pushed that day (race-safe)."""
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO insight_push_log (user_id, push_date) VALUES (%s, %s) "
            "ON CONFLICT DO NOTHING",
            (user_id, push_date),
        )
        inserted = cur.rowcount > 0
        conn.commit()
    return inserted
