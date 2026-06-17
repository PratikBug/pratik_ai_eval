"""Tests proving suggested fixes for blocking SQL injection and pagination."""

import pytest

from db_search_and_pagination import init_db, search_notes, list_notes, DB_PATH, get_conn


@pytest.fixture(autouse=True)
def clean_db():
    if DB_PATH.exists():
        DB_PATH.unlink()
    init_db()
    with get_conn() as conn:
        conn.execute("INSERT INTO notes (title, body) VALUES ('secret', 'vault')")
        conn.execute("INSERT INTO notes (title, body) VALUES ('public', 'info')")
    yield
    if DB_PATH.exists():
        DB_PATH.unlink()


def test_search_rejects_injection():
    rows = search_notes("' OR '1'='1")
    assert len(rows) == 0


def test_pagination_first_page():
    with get_conn() as conn:
        for i in range(12):
            conn.execute("INSERT INTO notes (title, body) VALUES (?, '')", (f"n{i}",))
    page1 = list_notes(page=1)
    assert len(page1) == 10
