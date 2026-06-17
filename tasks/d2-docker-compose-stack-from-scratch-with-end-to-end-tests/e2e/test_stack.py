import os
import time
from uuid import UUID

import httpx
import pytest

API_BASE = os.environ.get("D2_API_URL", "http://127.0.0.1:8090")

SEED_JOB_IDS = [
    UUID("11111111-1111-4111-8111-111111111111"),
    UUID("22222222-2222-4222-8222-222222222222"),
    UUID("33333333-3333-4333-8333-333333333333"),
]


@pytest.fixture
def client() -> httpx.Client:
    with httpx.Client(base_url=API_BASE, timeout=10.0) as http:
        yield http


def test_health(client: httpx.Client) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_seeded_jobs_visible(client: httpx.Client) -> None:
    response = client.get("/jobs")
    assert response.status_code == 200
    jobs = response.json()
    assert len(jobs) >= 3
    names = {job["name"] for job in jobs}
    assert "seed-import-orders" in names
    assert "seed-send-notifications" in names
    assert "seed-reconcile-balances" in names


def test_post_job_eventually_done(client: httpx.Client) -> None:
    create = client.post("/jobs", json={"name": "e2e-created-job"})
    assert create.status_code == 201
    job = create.json()
    job_id = job["id"]
    assert job["status"] == "pending"

    deadline = time.time() + 30
    final_status = job["status"]
    while time.time() < deadline:
        poll = client.get(f"/jobs/{job_id}")
        assert poll.status_code == 200
        final_status = poll.json()["status"]
        if final_status == "done":
            break
        time.sleep(0.5)

    assert final_status == "done", f"Job {job_id} did not reach done in time"


def test_worker_processed_seeded_job(client: httpx.Client) -> None:
    deadline = time.time() + 45
    done_count = 0
    while time.time() < deadline:
        done_count = 0
        for job_id in SEED_JOB_IDS:
            response = client.get(f"/jobs/{job_id}")
            assert response.status_code == 200
            if response.json()["status"] == "done":
                done_count += 1
        if done_count >= 1:
            break
        time.sleep(0.5)

    assert done_count >= 1, "Worker did not process any seeded job"
