"""Product catalog store — N+1 query path vs batched lookup."""

from __future__ import annotations

import sqlite3
from typing import Any

PRODUCT_COUNT = 2000


def init_db(conn: sqlite3.Connection, product_count: int = PRODUCT_COUNT) -> None:
    conn.executescript(
        """
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        );
        CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category_id INTEGER NOT NULL,
            price_cents INTEGER NOT NULL,
            in_stock INTEGER NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
        """
    )
    categories = [("Electronics",), ("Home",), ("Outdoor",), ("Office",)]
    conn.executemany("INSERT INTO categories (name) VALUES (?)", categories)

    rows = []
    for product_id in range(1, product_count + 1):
        rows.append(
            (
                f"Product {product_id:04d}",
                (product_id % 4) + 1,
                199 + (product_id * 17) % 5000,
                1 if product_id % 7 else 0,
            )
        )
    conn.executemany(
        "INSERT INTO products (name, category_id, price_cents, in_stock) VALUES (?, ?, ?, ?)",
        rows,
    )
    conn.commit()


def _row_to_summary(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "price_cents": row["price_cents"],
        "in_stock": bool(row["in_stock"]),
    }


def fetch_summaries_n_plus_one(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    """Baseline hot path: one query per product (classic N+1)."""
    product_ids = [
        row[0]
        for row in conn.execute("SELECT id FROM products ORDER BY id").fetchall()
    ]
    summaries: list[dict[str, Any]] = []
    for product_id in product_ids:
        row = conn.execute(
            """
            SELECT p.id, p.name, c.name AS category, p.price_cents, p.in_stock
            FROM products p
            JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
            """,
            (product_id,),
        ).fetchone()
        if row is not None:
            summaries.append(_row_to_summary(row))
    return summaries


def fetch_summaries_batched(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    """Optimized path: single JOIN query for all products."""
    rows = conn.execute(
        """
        SELECT p.id, p.name, c.name AS category, p.price_cents, p.in_stock
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ORDER BY p.id
        """
    ).fetchall()
    return [_row_to_summary(row) for row in rows]
