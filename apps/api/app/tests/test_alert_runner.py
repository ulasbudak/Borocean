from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app import alert_runner, alerts, main, notifications
from app.alerts import PriceAlert
from app.config import Settings
from app.market_data import StockOverview


@pytest.fixture
def anyio_backend():
    return "asyncio"


def price_alert(alert_id: str, symbol: str, direction="above", threshold=100.0) -> PriceAlert:
    return PriceAlert(
        id=alert_id,
        symbol=symbol,
        exchange="US",
        name=None,
        direction=direction,
        threshold=threshold,
        status="active",
        created_at=datetime(2026, 10, 1, tzinfo=UTC),
    )


@pytest.fixture
def notified(monkeypatch):
    calls = []

    async def fake_notify(user_id, email, title, body, *, locale="tr", alerts_path="/alerts"):
        calls.append((user_id, email, title, body, locale))

    monkeypatch.setattr(alerts, "notify_trigger", fake_notify)
    return calls


@pytest.mark.anyio
async def test_price_run_quotes_each_symbol_once_and_notifies_owners(monkeypatch, notified):
    owners = {
        "u1": {"email": "a@x.com", "locale": "tr", "alerts": [price_alert("1", "AAPL")]},
        "u2": {
            "email": "b@x.com",
            "locale": "en",
            "alerts": [price_alert("2", "AAPL"), price_alert("3", "MSFT")],
        },
    }
    quoted = []

    async def fake_overview(symbol):
        quoted.append(symbol)
        return StockOverview(
            symbol=symbol, exchange="US", name=symbol, price=150.0 if symbol == "AAPL" else 50.0
        )

    monkeypatch.setattr(alerts, "list_active_us_alerts_by_user", lambda: owners)
    monkeypatch.setattr(alerts, "get_us_overview", fake_overview)
    monkeypatch.setattr(alerts, "_mark_triggered", lambda alert_id: True)

    result = await alert_runner.run_price_alerts()

    assert sorted(quoted) == ["AAPL", "MSFT"]  # AAPL quoted once for two users
    assert result == {"users": 2, "symbols": 2, "unavailable": 0, "triggered": 2}
    assert [(c[0], c[4]) for c in notified] == [("u1", "tr"), ("u2", "en")]
    assert notified[0][2] == "Borocean Fiyat Alarmı"
    assert notified[1][3] == "AAPL (AAPL) rose above 100.0."


@pytest.mark.anyio
async def test_no_second_notification_when_the_alert_was_already_triggered(monkeypatch, notified):
    async def fake_overview(symbol):
        return StockOverview(symbol=symbol, exchange="US", name=symbol, price=150.0)

    monkeypatch.setattr(alerts, "get_us_overview", fake_overview)
    # The page-load path triggered it a moment earlier: this call loses the race.
    monkeypatch.setattr(alerts, "_mark_triggered", lambda alert_id: False)

    await alerts.evaluate_and_persist([price_alert("1", "AAPL")], user_id="u1", email="a@x.com")

    assert notified == []


def test_alert_email_has_links_and_disclaimer_in_the_users_language():
    text, html = notifications.alert_email(
        "Borocean Fiyat Alarmı", "AAPL 100 seviyesinin üstüne yükseldi.", "tr", "/alerts"
    )
    assert "https://borocean.com/alerts" in text and "https://borocean.com/settings" in text
    assert "yatırım tavsiyesi değildir" in text
    assert 'charset="utf-8"' in html and "Alarmlarını gör" in html
    text_en, _ = notifications.alert_email("t", "<b>x</b>", "en", "/signal-alerts")
    assert "https://borocean.com/signal-alerts" in text_en and "not investment advice" in text_en
    _, html_en = notifications.alert_email("t", "<b>x</b>", "en", "/alerts")
    assert "<b>x</b>" not in html_en  # body is escaped


client = TestClient(main.app)


def test_alert_run_endpoint_checks_secret_and_kind(monkeypatch):
    started = []
    monkeypatch.setattr(main, "get_settings", lambda: Settings(cron_secret="s3cret"))
    monkeypatch.setattr(
        main.alert_runner, "start_background_run", lambda kind: started.append(kind) or True
    )

    assert client.post("/internal/alerts/run?kind=price").status_code == 401
    headers = {"X-Cron-Secret": "s3cret"}
    assert client.post("/internal/alerts/run?kind=nope", headers=headers).status_code == 400
    assert client.post("/internal/alerts/run?kind=price", headers=headers).status_code == 202
    assert client.post("/internal/alerts/run?kind=signal", headers=headers).status_code == 202
    assert started == ["price", "signal"]
