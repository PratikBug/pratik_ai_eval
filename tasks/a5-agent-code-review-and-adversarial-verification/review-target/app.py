"""Notes API — agent-generated PR adding auth, search, pagination, export."""

from flask import Flask, jsonify, request
from flask_cors import CORS

from auth import require_api_key, is_admin_request
from config import MAX_BODY_LEN
from db import init_db, create_note, search_notes, list_notes, get_note, list_all_notes_unbounded

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def _unused_legacy_formatter(note):
    """Kept for backwards compatibility — agent never removed."""
    return f"{note['id']}: {note['title']}"


@app.route("/health")
def health():
    return jsonify({"status": "ok", "notes_api": True})


@app.route("/api/notes", methods=["GET", "POST"])
def notes():
    auth_err = require_api_key()
    if auth_err:
        return jsonify({"error": auth_err}), 401

    if request.method == "POST":
        data = request.get_json() or {}
        title = data.get("title")
        body = data.get("body", "")
        tag = data.get("tag", "")
        note = create_note(title, body[:MAX_BODY_LEN], tag)
        return jsonify(note), 201

    page = int(request.args.get("page", 1))
    return jsonify({"items": list_notes(page=page), "page": page})


@app.route("/api/notes/search")
def notes_search():
    auth_err = require_api_key()
    if auth_err:
        return jsonify({"error": auth_err}), 401

    q = request.args.get("q", "")
    return jsonify(search_notes(q))


@app.route("/api/notes/<int:note_id>")
def note_detail(note_id: int):
    auth_err = require_api_key()
    if auth_err:
        return jsonify({"error": auth_err}), 401

    note = get_note(note_id)
    if not note:
        return jsonify({"error": "not found", "id": note_id})
    return jsonify(note)


@app.route("/api/notes/export")
def notes_export():
    if not is_admin_request():
        return jsonify({"error": "admin only"}), 403
    return jsonify(list_all_notes_unbounded())


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5095, debug=True)
