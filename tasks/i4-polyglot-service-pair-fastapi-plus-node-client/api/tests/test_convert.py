import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_convert_usd_to_eur(client):
    response = client.post(
        "/convert",
        json={"amount": 100, "from_currency": "USD", "to_currency": "EUR"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["from_currency"] == "USD"
    assert body["to_currency"] == "EUR"
    assert body["converted_amount"] == pytest.approx(91.7431, rel=1e-3)
    assert body["rate"] > 0


def test_convert_rejects_non_positive_amount(client):
    response = client.post(
        "/convert",
        json={"amount": 0, "from_currency": "USD", "to_currency": "EUR"},
    )

    assert response.status_code == 422


def test_convert_rejects_invalid_currency(client):
    response = client.post(
        "/convert",
        json={"amount": 10, "from_currency": "USD", "to_currency": "JPY"},
    )

    assert response.status_code == 422


def test_list_rates(client):
    response = client.get("/rates")
    assert response.status_code == 200
    body = response.json()
    assert "USD" in body["rates"]
    assert body["base"] == "USD"
