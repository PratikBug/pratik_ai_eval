"""Fixed search — parameterized query prevents SQL injection."""

import sqlite3
from pathlib import Path

PAGE_SIZE = 10
DB_PATH = Path(__file__).with_name("notes.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                body TEXT NOT NULL DEFAULT '',
                tag TEXT DEFAULT ''
            )
            """
        )


def search_notes(query: str) -> list[dict]:
    pattern = f"%{query}%"
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, body, tag FROM notes WHERE title LIKE ? OR body LIKE ?",
            (pattern, pattern),
        ).fetchall()
    return [dict(r) for r in rows]


def list_notes(page: int = 1):
    page = max(1, page)
    offset = (page - 1) * PAGE_SIZE
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, body, tag FROM notes ORDER BY id DESC LIMIT ? OFFSET ?",
            (PAGE_SIZE, offset),
        ).fetchall()
    return [dict(r) for r in rows]
