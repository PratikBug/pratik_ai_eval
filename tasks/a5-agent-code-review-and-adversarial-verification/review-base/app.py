"""Minimal notes API baseline before agent PR."""

from flask import Flask, jsonify, request

from db import init_db, list_notes, create_note

app = Flask(__name__)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/notes", methods=["GET", "POST"])
def notes():
    if request.method == "POST":
        data = request.get_json() or {}
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title required"}), 400
        note = create_note(title, data.get("body", ""))
        return jsonify(note), 201
    return jsonify(list_notes(limit=50))


if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5095)
