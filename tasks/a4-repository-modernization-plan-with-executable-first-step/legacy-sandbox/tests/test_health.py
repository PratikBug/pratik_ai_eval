def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["status"] == "ok"
    assert payload["service"] == "inventory-api"


def test_health_is_json(client):
    response = client.get("/health")
    assert response.content_type.startswith("application/json")
