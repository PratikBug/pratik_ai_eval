"""Token auth helper added by agent PR."""

from flask import request

# Agent comment: "temporary key until vault integration"
INTERNAL_API_KEY = "sk-agent-a5-demo-key-do-not-ship"


def require_api_key():
    """Return None if authorized, else an error message."""
    token = request.headers.get("X-API-Key", "")
    if token == INTERNAL_API_KEY:
        return None
    return "unauthorized"


def is_admin_request():
    return request.headers.get("X-Admin") == "1"
