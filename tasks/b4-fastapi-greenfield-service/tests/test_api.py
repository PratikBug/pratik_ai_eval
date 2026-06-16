import pytest
from fastapi.testclient import TestClient

from src.main import app, reset_store


@pytest.fixture(autouse=True)
def clean_store():
    reset_store()
    yield
    reset_store()


@pytest.fixture
def client():
    return TestClient(app)


def test_post_transaction_creates_record(client):
    response = client.post(
        "/transactions",
        json={"amount": "100.50", "type": "credit", "description": "Opening deposit"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["amount"] == "100.50"
    assert body["type"] == "credit"
    assert body["description"] == "Opening deposit"


def test_get_transactions_lists_created_records(client):
    client.post("/transactions", json={"amount": "25.00", "type": "credit"})
    client.post("/transactions", json={"amount": "10.00", "type": "debit"})

    response = client.get("/transactions")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["type"] == "credit"
    assert body[1]["type"] == "debit"


def test_get_balance_reflects_credits_and_debits(client):
    client.post("/transactions", json={"amount": "100.00", "type": "credit"})
    client.post("/transactions", json={"amount": "30.00", "type": "debit"})
    client.post("/transactions", json={"amount": "5.50", "type": "credit"})

    response = client.get("/balance")

    assert response.status_code == 200
    assert response.json() == {"balance": "75.50", "currency": "USD"}


def test_post_transaction_rejects_invalid_amount(client):
    response = client.post("/transactions", json={"amount": "0", "type": "credit"})

    assert response.status_code == 422


def test_post_transaction_rejects_invalid_type(client):
    response = client.post("/transactions", json={"amount": "10.00", "type": "transfer"})

    assert response.status_code == 422
