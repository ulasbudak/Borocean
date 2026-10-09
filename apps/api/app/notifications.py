from html import escape

import httpx
from psycopg.rows import dict_row
from pydantic import BaseModel

from app.config import get_settings
from app.db import get_connection

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
RESEND_URL = "https://api.resend.com/emails"
NOTIFICATION_TIMEOUT_SECONDS = 5.0


class NotificationSettings(BaseModel):
    expo_push_token: str | None = None
    push_enabled: bool = True
    email_enabled: bool = True


def get_settings_for_user(user_id: str) -> NotificationSettings:
    with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT expo_push_token, push_enabled, email_enabled "
            "FROM user_notification_settings WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()
    if row is None:
        return NotificationSettings()
    return NotificationSettings(**row)


def upsert_settings_for_user(
    user_id: str,
    *,
    expo_push_token: str | None = None,
    push_enabled: bool | None = None,
    email_enabled: bool | None = None,
) -> NotificationSettings:
    current = get_settings_for_user(user_id)
    merged = NotificationSettings(
        expo_push_token=expo_push_token if expo_push_token is not None else current.expo_push_token,
        push_enabled=push_enabled if push_enabled is not None else current.push_enabled,
        email_enabled=email_enabled if email_enabled is not None else current.email_enabled,
    )
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO user_notification_settings
                (user_id, expo_push_token, push_enabled, email_enabled, updated_at)
            VALUES (%s, %s, %s, %s, now())
            ON CONFLICT (user_id) DO UPDATE SET
                expo_push_token = EXCLUDED.expo_push_token,
                push_enabled = EXCLUDED.push_enabled,
                email_enabled = EXCLUDED.email_enabled,
                updated_at = now()
            """,
            (user_id, merged.expo_push_token, merged.push_enabled, merged.email_enabled),
        )
        conn.commit()
    return merged


async def send_expo_push(
    token: str,
    title: str,
    body: str,
    *,
    data: dict | None = None,
    client: httpx.AsyncClient | None = None,
) -> bool:
    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=NOTIFICATION_TIMEOUT_SECONDS)
    try:
        response = await http_client.post(
            EXPO_PUSH_URL,
            json={"to": token, "title": title, "body": body, **({"data": data} if data else {})},
            headers={"Content-Type": "application/json"},
        )
        return response.status_code == 200
    except httpx.HTTPError:
        return False
    finally:
        if owns_client:
            await http_client.aclose()


async def send_email(
    to: str,
    subject: str,
    body: str,
    *,
    html: str | None = None,
    client: httpx.AsyncClient | None = None,
) -> bool:
    settings = get_settings()
    if not settings.resend_api_key:
        return False

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=NOTIFICATION_TIMEOUT_SECONDS)
    try:
        response = await http_client.post(
            RESEND_URL,
            json={
                "from": settings.notification_from_email,
                "to": [to],
                "subject": subject,
                "text": body,
                **({"html": html} if html else {}),
            },
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
        )
        return response.status_code < 300
    except httpx.HTTPError:
        return False
    finally:
        if owns_client:
            await http_client.aclose()


SITE_URL = "https://borocean.com"
_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
_BUTTON = (
    "display:inline-block;background:#2563eb;color:#fff;text-decoration:none;"
    "font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;"
)

EMAIL_FOOTER = {
    "tr": {
        "alerts": "Alarmlarını gör",
        "settings": "Bildirim ayarları",
        "disclaimer": "Bu bildirim, kurduğun alarma göre otomatik gönderilmiştir; yatırım "
        "tavsiyesi değildir.",
    },
    "en": {
        "alerts": "View your alerts",
        "settings": "Notification settings",
        "disclaimer": "This notification was sent automatically for an alert you set; it is "
        "not investment advice.",
    },
}


def alert_email(title: str, body: str, locale: str, alerts_path: str) -> tuple[str, str]:
    """Plain-text and HTML versions of an alert email: the message, links to the alerts
    page and notification settings, and the not-investment-advice notice (Story 14.2)."""
    f = EMAIL_FOOTER["en" if locale == "en" else "tr"]
    alerts_url = f"{SITE_URL}{alerts_path}"
    settings_url = f"{SITE_URL}/settings"
    text = (
        f"{body}\n\n{f['alerts']}: {alerts_url}\n{f['settings']}: {settings_url}\n\n"
        f"{f['disclaimer']}"
    )
    html = (
        f'<!doctype html><html lang="{locale}"><head><meta charset="utf-8"></head>'
        f'<body style="margin:0;background:#f6f8fb;font-family:{_FONT};color:#0f172a;">'
        '<div style="max-width:480px;margin:0 auto;padding:32px 16px;">'
        '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;'
        'padding:28px;">'
        '<p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#2563eb;">'
        "Borocean</p>"
        f'<h1 style="margin:0 0 12px;font-size:18px;">{escape(title)}</h1>'
        '<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">'
        f"{escape(body)}</p>"
        f'<a href="{alerts_url}" style="{_BUTTON}">{f["alerts"]}</a>'
        '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">'
        '<p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">'
        f'{f["disclaimer"]}<br><a href="{settings_url}" style="color:#94a3b8;">'
        f"{f['settings']}</a></p>"
        "</div></div></body></html>"
    )
    return text, html


async def notify_trigger(
    user_id: str,
    email: str | None,
    title: str,
    body: str,
    *,
    locale: str = "tr",
    alerts_path: str = "/alerts",
) -> None:
    """Best-effort notification dispatch for a just-triggered alert.

    Never raises: a notification-delivery failure must not break the /alerts or
    /signal-alerts response that triggered it (the alert is already persisted as
    triggered regardless of whether we manage to tell the user about it).
    """
    try:
        settings = get_settings_for_user(user_id)
    except Exception:
        return

    if settings.push_enabled and settings.expo_push_token:
        try:
            await send_expo_push(settings.expo_push_token, title, body)
        except Exception:
            pass

    if settings.email_enabled and email:
        try:
            text, html = alert_email(title, body, locale, alerts_path)
            await send_email(email, title, text, html=html)
        except Exception:
            pass
