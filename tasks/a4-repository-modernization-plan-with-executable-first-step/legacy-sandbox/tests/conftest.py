import pytest

from app import ITEMS, app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    ITEMS.clear()
    with app.test_client() as test_client:
        yield test_client
    ITEMS.clear()
