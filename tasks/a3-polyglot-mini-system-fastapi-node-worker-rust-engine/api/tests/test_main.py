from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from src.main import app, score_store


@pytest.fixture(autouse=True)
def clear_store():
    score_store.clear()
    yield
    score_store.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("src.main.httpx.post")
def test_post_event_accepted(mock_post, client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "transaction_id": "tx-1",
        "score": 73,
        "reasons": ["amount_band"],
    }
    mock_post.return_value = mock_response

    response = client.post(
        "/events",
        json={"transaction_id": "tx-1", "amount": 150.0, "merchant_id": "m-42"},
    )
    assert response.status_code == 202
    assert response.json() == {"transaction_id": "tx-1", "status": "accepted"}


@patch("src.main.httpx.post")
def test_get_score_after_event(mock_post, client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "transaction_id": "tx-2",
        "score": 55,
        "reasons": ["baseline"],
    }
    mock_post.return_value = mock_response

    client.post(
        "/events",
        json={"transaction_id": "tx-2", "amount": 25.0, "merchant_id": "acme"},
    )
    response = client.get("/scores/tx-2")
    assert response.status_code == 200
    body = response.json()
    assert body["transaction_id"] == "tx-2"
    assert body["score"] == 55


def test_post_event_validation(client):
    response = client.post("/events", json={"transaction_id": "tx-3", "amount": 0, "merchant_id": "x"})
    assert response.status_code == 422


def test_get_score_not_found(client):
    response = client.get("/scores/missing")
    assert response.status_code == 404
