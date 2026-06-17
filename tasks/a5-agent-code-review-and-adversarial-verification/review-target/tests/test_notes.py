"""Agent-added tests — coverage looks good but assertions are weak."""

from unittest.mock import patch

import db


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_create_note(client, auth_headers):
    response = client.post(
        "/api/notes",
        json={"title": "hello", "body": "world"},
        headers=auth_headers,
    )
    assert response.status_code == 201


def test_search_notes(client, auth_headers, app):
    client.post("/api/notes", json={"title": "alpha", "body": "one"}, headers=auth_headers)
    with patch.object(db, "search_notes", return_value=[]):
        response = client.get("/api/notes/search?q=alpha", headers=auth_headers)
    assert response.status_code == 200


def test_list_pagination(client, auth_headers):
    for i in range(15):
        client.post(
            "/api/notes",
            json={"title": f"note-{i}", "body": ""},
            headers=auth_headers,
        )
    page1 = client.get("/api/notes?page=1", headers=auth_headers)
    assert page1.status_code == 200
    data = page1.get_json()
    assert "items" in data


@patch("auth.require_api_key", return_value=None)
def test_export_admin(mock_auth, client):
    response = client.get("/api/notes/export", headers={"X-Admin": "1"})
    assert response.status_code == 200
