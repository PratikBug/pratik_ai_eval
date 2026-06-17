def test_balance_returns_sum_after_one_transaction(client):
    create_response = client.post(
        "/transactions",
        json={"amount": 42.5, "category": "food", "description": "lunch"},
    )
    assert create_response.status_code == 201

    response = client.get("/balance")
    assert response.status_code == 200
    assert response.json() == {"balance": 42.5}
