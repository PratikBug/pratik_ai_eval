"""Legacy inventory micro-API — monolithic Flask app (pre-modernization baseline)."""

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-secret-do-not-use-in-prod"
DEBUG = True

ITEMS: list[dict] = []


@app.route("/")
def index():
    return render_template("index.html", items=ITEMS)


@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "inventory-api"})


@app.route("/api/items", methods=["GET", "POST"])
def items():
    if request.method == "POST":
        data = request.get_json() or {}
        name = data.get("name", "")
        item = {"id": len(ITEMS) + 1, "name": name}
        ITEMS.append(item)
        return jsonify(item), 201
    return jsonify(ITEMS)


@app.route("/api/items/<int:item_id>")
def get_item(item_id):
    for item in ITEMS:
        if item["id"] == item_id:
            return jsonify(item)
    return jsonify({"error": "not found"}), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=DEBUG)
