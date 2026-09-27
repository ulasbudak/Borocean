

def test_cached_report_from_an_older_prompt_version_is_a_miss(monkeypatch):
    """Story 12.1 — reports generated under the pre-compliance prompts aren't served."""
    from contextlib import contextmanager
    from datetime import UTC, datetime

    from app import ai_reports

    rows = {
        "old": {"content": {"report": "eski"}, "generated_at": datetime.now(UTC)},
        "new": {
            "content": {"report": "yeni", "prompt_version": ai_reports.PROMPT_VERSION},
            "generated_at": datetime.now(UTC),
        },
    }
    current = {}

    class FakeCursor:
        def execute(self, query, params=None):
            current["row"] = rows[params[2]]

        def fetchone(self):
            return current["row"]

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    class FakeConnection:
        def cursor(self, row_factory=None):
            return FakeCursor()

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    @contextmanager
    def fake_get_connection():
        yield FakeConnection()

    monkeypatch.setattr(ai_reports, "get_connection", fake_get_connection)

    assert ai_reports.get_cached_report("AAPL", "US", "old", 24) is None
    assert ai_reports.get_cached_report("AAPL", "US", "new", 24)[0]["report"] == "yeni"


def test_ensure_disclaimer_appends_only_when_missing():
    from app.ai_reports import DISCLAIMER_LINE, ensure_disclaimer

    assert ensure_disclaimer("Rapor.") == f"Rapor.\n\n{DISCLAIMER_LINE}"
    already = "Rapor.\n\nBu içerik yatırım tavsiyesi değildir."
    assert ensure_disclaimer(already) == already
