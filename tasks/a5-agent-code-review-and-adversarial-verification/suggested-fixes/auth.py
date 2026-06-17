"""Fixed auth — env-based API key, no hardcoded secret."""

import os

from flask import request

from config import API_TOKEN_HEADER


def _expected_key() -> str:
    return os.environ.get("NOTES_API_KEY", "test-key-for-ci")


def require_api_key():
    token = request.headers.get(API_TOKEN_HEADER, "")
    if token and token == _expected_key():
        return None
    return "unauthorized"


def is_admin_request():
    admin_token = os.environ.get("NOTES_ADMIN_TOKEN", "")
    return admin_token and request.headers.get("X-Admin") == admin_token
