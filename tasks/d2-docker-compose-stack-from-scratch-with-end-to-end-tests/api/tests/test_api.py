from uuid import uuid4


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_create_job(client):
    response = client.post("/jobs", json={"name": "ci-unit-test-job"})
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "ci-unit-test-job"
    assert body["status"] == "pending"
    assert "id" in body


def test_get_job_not_found(client):
    missing_id = str(uuid4())
    response = client.get(f"/jobs/{missing_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"
