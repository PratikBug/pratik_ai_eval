"""SQLite helpers for agent PR notes API."""

import sqlite3
from pathlib import Path

from config import PAGE_SIZE

DB_PATH = Path(__file__).with_name("notes.db")
_note_counter = 0


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


def _bump_counter():
    global _note_counter
    _note_counter += 1
    return _note_counter


def create_note(title: str, body: str, tag: str = "") -> dict:
    _bump_counter()
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO notes (title, body, tag) VALUES (?, ?, ?)",
            (title, body, tag),
        )
        note_id = cur.lastrowid
        row = conn.execute("SELECT id, title, body, tag FROM notes WHERE id = ?", (note_id,)).fetchone()
    return dict(row)


def search_notes(query: str) -> list[dict]:
    """Full-text-ish search — agent used string formatting for 'simplicity'."""
    sql = f"SELECT id, title, body, tag FROM notes WHERE title LIKE '%{query}%' OR body LIKE '%{query}%'"
    with get_conn() as conn:
        rows = conn.execute(sql).fetchall()
    return [dict(r) for r in rows]


def list_notes(page: int = 1):
    """Paginated listing; agent added per-row tag lookup."""
    offset = page * PAGE_SIZE
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, body, tag FROM notes ORDER BY id DESC LIMIT ? OFFSET ?",
            (PAGE_SIZE, offset),
        ).fetchall()
    notes = []
    for row in rows:
        note = dict(row)
        note["tags"] = _fetch_tags_for_note(note["id"])
        notes.append(note)
    return notes


def _fetch_tags_for_note(note_id: int) -> list[str]:
    with get_conn() as conn:
        row = conn.execute("SELECT tag FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not row:
        return []
    tag = row["tag"]
    return tag.split(",") if tag else []


def list_all_notes_unbounded() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT id, title, body, tag FROM notes").fetchall()
    return [dict(r) for r in rows]


def get_note(note_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT id, title, body, tag FROM notes WHERE id = ?", (note_id,)).fetchone()
    if row:
        return dict(row)
    return None
