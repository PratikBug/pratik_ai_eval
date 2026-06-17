import os
import pytest

os.environ.setdefault("FLASK_ENV", "testing")

from app import app as flask_app
from db import init_db, DB_PATH


@pytest.fixture
def app():
    if DB_PATH.exists():
        DB_PATH.unlink()
    init_db()
    flask_app.config.update({"TESTING": True})
    yield flask_app
    if DB_PATH.exists():
        DB_PATH.unlink()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers():
    return {"X-API-Key": "sk-agent-a5-demo-key-do-not-ship"}
