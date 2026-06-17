#!/usr/bin/env bash
# A5 verification — run from task directory
set -euo pipefail

TASK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$TASK_DIR/review-target"
OUT="$TASK_DIR/artifacts/verification-output.txt"

mkdir -p "$TASK_DIR/artifacts"

{
  echo "=== A5 adversarial verification ==="
  echo "Started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo

  echo "--- 1. Grep hardcoded secrets ---"
  rg -n "sk-agent|INTERNAL_API_KEY|do-not-ship" "$TARGET" || true
  echo

  echo "--- 2. Grep SQL string interpolation ---"
  rg -n "f\"SELECT|f'SELECT" "$TARGET" || true
  echo

  echo "--- 3. Grep open CORS ---"
  rg -n 'origins.*\*' "$TARGET" || true
  echo

  echo "--- 4. Pytest (agent tests — pass but weak) ---"
  cd "$TARGET"
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt -r requirements-dev.txt
  fi
  .venv/bin/pytest -v
  echo

  echo "--- 5. Adversarial: SQL injection probe ---"
  .venv/bin/python - <<'PY'
from urllib.parse import quote
from app import app
from db import init_db, DB_PATH

if DB_PATH.exists():
    DB_PATH.unlink()
init_db()

client = app.test_client()
headers = {"X-API-Key": "sk-agent-a5-demo-key-do-not-ship"}
client.post("/api/notes", json={"title": "secret", "body": "vault"}, headers=headers)
client.post("/api/notes", json={"title": "public", "body": "info"}, headers=headers)
payload = quote("' OR 1=1--")
resp = client.get(f"/api/notes/search?q={payload}", headers=headers)
data = resp.get_json()
print("search status:", resp.status_code, "rows:", len(data))
print("INJECTION_LEAK" if len(data) >= 2 else "injection contained")
PY
  echo

  echo "--- 6. Adversarial: missing title POST ---"
  .venv/bin/python - <<'PY'
from app import app
from db import init_db, DB_PATH

if DB_PATH.exists():
    DB_PATH.unlink()
init_db()

client = app.test_client()
headers = {"X-API-Key": "sk-agent-a5-demo-key-do-not-ship"}
resp = client.post("/api/notes", json={"title": None, "body": "x"}, headers=headers)
print("status:", resp.status_code, "body:", resp.get_json())
PY
  echo

  echo "--- 7. Adversarial: pagination off-by-one ---"
  .venv/bin/python - <<'PY'
from app import app
from db import init_db, DB_PATH

if DB_PATH.exists():
    DB_PATH.unlink()
init_db()

client = app.test_client()
headers = {"X-API-Key": "sk-agent-a5-demo-key-do-not-ship"}
for i in range(12):
    client.post("/api/notes", json={"title": f"n{i}", "body": ""}, headers=headers)
p1 = client.get("/api/notes?page=1", headers=headers).get_json()["items"]
p0 = client.get("/api/notes?page=0", headers=headers).get_json()["items"]
print("page1 count:", len(p1), "page0 count:", len(p0), "expected page1=10 page0=10")
PY
  echo

  echo "--- 8. Adversarial: not-found status code ---"
  .venv/bin/python - <<'PY'
from app import app
from db import init_db, DB_PATH

if DB_PATH.exists():
    DB_PATH.unlink()
init_db()

client = app.test_client()
headers = {"X-API-Key": "sk-agent-a5-demo-key-do-not-ship"}
resp = client.get("/api/notes/9999", headers=headers)
print("status:", resp.status_code, "expected 404 got", resp.status_code)
PY

  echo
  echo "--- 9. Suggested fixes pytest ---"
  cd "$TASK_DIR/suggested-fixes"
  PYTHONPATH=. python3 -m pytest test_fixes.py -v

  echo
  echo "=== Verification complete ==="
} 2>&1 | tee "$OUT"

echo "Wrote $OUT"
