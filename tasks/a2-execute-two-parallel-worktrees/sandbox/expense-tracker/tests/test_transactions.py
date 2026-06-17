def test_post_transaction_returns_201(client):
    response = client.post(
        "/transactions",
        json={"amount": 10.5, "category": "food", "description": "lunch"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 10.5
    assert data["category"] == "food"
    assert data["description"] == "lunch"
    assert "id" in data
    assert "created_at" in data


def test_post_transaction_missing_amount_returns_422(client):
    response = client.post("/transactions", json={"category": "food"})
    assert response.status_code == 422


def test_post_transaction_non_positive_amount_returns_422(client):
    response = client.post(
        "/transactions",
        json={"amount": 0, "category": "food"},
    )
    assert response.status_code == 422


def test_get_transactions_returns_list(client):
    response = client.get("/transactions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
