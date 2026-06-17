import sqlite3

import pytest

from store import (
    PRODUCT_COUNT,
    fetch_summaries_batched,
    fetch_summaries_n_plus_one,
    init_db,
)


@pytest.fixture
def conn():
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    init_db(connection, PRODUCT_COUNT)
    yield connection
    connection.close()


def test_both_paths_return_same_count(conn):
    slow = fetch_summaries_n_plus_one(conn)
    fast = fetch_summaries_batched(conn)
    assert len(slow) == PRODUCT_COUNT
    assert len(fast) == PRODUCT_COUNT


def test_both_paths_return_identical_payloads(conn):
    slow = fetch_summaries_n_plus_one(conn)
    fast = fetch_summaries_batched(conn)
    assert slow == fast


def test_summary_shape(conn):
    row = fetch_summaries_batched(conn)[0]
    assert set(row.keys()) == {"id", "name", "category", "price_cents", "in_stock"}
    assert isinstance(row["price_cents"], int)


def test_sorted_by_id(conn):
    ids = [row["id"] for row in fetch_summaries_batched(conn)]
    assert ids == sorted(ids)
