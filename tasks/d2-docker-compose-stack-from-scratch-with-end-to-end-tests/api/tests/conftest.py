from __future__ import annotations

from contextlib import contextmanager
from typing import Any
from uuid import UUID, uuid4

import pytest


class JobStore:
    def __init__(self) -> None:
        self.jobs: list[dict[str, Any]] = []

    def add(self, name: str, status: str = "pending") -> dict[str, Any]:
        job = {"id": uuid4(), "name": name, "status": status}
        self.jobs.append(job)
        return job

    def get(self, job_id: UUID) -> dict[str, Any] | None:
        for job in self.jobs:
            if job["id"] == job_id:
                return job
        return None


class FakeCursor:
    def __init__(self, store: JobStore) -> None:
        self.store = store
        self._rows: list[tuple[Any, ...]] = []
        self._one: tuple[Any, ...] | None = None

    def __enter__(self) -> FakeCursor:
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def execute(self, sql: str, params: tuple[Any, ...] | None = None) -> None:
        normalized = " ".join(sql.split())
        if "SELECT 1" in normalized:
            self._one = (1,)
            self._rows = []
            return
        if "FROM jobs ORDER BY created_at ASC" in normalized:
            self._rows = [(j["id"], j["name"], j["status"]) for j in self.store.jobs]
            self._one = None
            return
        if "FROM jobs WHERE id = %s" in normalized:
            assert params is not None
            job = self.store.get(params[0])
            self._one = (job["id"], job["name"], job["status"]) if job else None
            self._rows = []
            return
        if "INSERT INTO jobs" in normalized and "RETURNING" in normalized:
            assert params is not None
            job = self.store.add(params[0], "pending")
            self._one = (job["id"], job["name"], job["status"])
            self._rows = []
            return
        raise AssertionError(f"Unexpected SQL in fake cursor: {normalized}")

    def fetchall(self) -> list[tuple[Any, ...]]:
        return self._rows

    def fetchone(self) -> tuple[Any, ...] | None:
        return self._one


class FakeConnection:
    def __init__(self, store: JobStore) -> None:
        self.store = store
        self.committed = False

    def __enter__(self) -> FakeConnection:
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def cursor(self) -> FakeCursor:
        return FakeCursor(self.store)

    def commit(self) -> None:
        self.committed = True


@pytest.fixture
def job_store() -> JobStore:
    return JobStore()


@pytest.fixture
def client(job_store: JobStore, monkeypatch: pytest.MonkeyPatch):
    from src import main

    @contextmanager
    def fake_get_conn():
        yield FakeConnection(job_store)

    monkeypatch.setattr(main, "get_conn", fake_get_conn)

    from fastapi.testclient import TestClient

    with TestClient(main.app) as test_client:
        yield test_client
