from contextlib import contextmanager

import psycopg
from fastapi.testclient import TestClient

from app import account, main
from app.auth import get_current_claims

client = TestClient(main.app)


def _fake_connection(executed: list, rowcount: int = 1, fail: bool = False):
    class FakeCursor:
        def __init__(self):
            self.rowcount = rowcount

        def execute(self, query, params=None):
            if fail:
                raise psycopg.OperationalError("db down")
            executed.append((query, params))

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    class FakeConnection:
        committed = False

        def cursor(self):
            return FakeCursor()

        def commit(self):
            executed.append(("COMMIT", None))

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    @contextmanager
    def fake_get_connection():
        yield FakeConnection()

    return fake_get_connection


def test_delete_account_deletes_the_auth_user_and_commits(monkeypatch):
    executed: list = []
    monkeypatch.setattr(account, "get_connection", _fake_connection(executed))

    assert account.delete_account("user-1") is True
    assert executed[0] == ("DELETE FROM auth.users WHERE id = %s", ("user-1",))
    assert executed[-1][0] == "COMMIT"


def test_delete_account_reports_missing_user(monkeypatch):
    monkeypatch.setattr(account, "get_connection", _fake_connection([], rowcount=0))

    assert account.delete_account("gone") is False


def test_delete_me_requires_auth():
    main.app.dependency_overrides.pop(get_current_claims, None)

    assert client.delete("/me").status_code == 401


def test_delete_me_deletes_only_the_callers_account(monkeypatch):
    deleted = []
    main.app.dependency_overrides[get_current_claims] = lambda: {"sub": "user-1"}
    monkeypatch.setattr(main, "delete_account", lambda user_id: deleted.append(user_id) or True)
    try:
        response = client.delete("/me")
    finally:
        main.app.dependency_overrides.pop(get_current_claims, None)

    assert response.status_code == 204
    assert deleted == ["user-1"]


def test_delete_me_returns_503_when_database_is_down(monkeypatch):
    main.app.dependency_overrides[get_current_claims] = lambda: {"sub": "user-1"}

    def failing(user_id):
        raise psycopg.OperationalError("db down")

    monkeypatch.setattr(main, "delete_account", failing)
    try:
        response = client.delete("/me")
    finally:
        main.app.dependency_overrides.pop(get_current_claims, None)

    assert response.status_code == 503
