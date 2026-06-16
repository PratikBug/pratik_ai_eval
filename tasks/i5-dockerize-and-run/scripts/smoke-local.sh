#!/usr/bin/env bash
# Local smoke test when Docker is unavailable — proves the same app responds before containerization.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
API_DIR="$REPO_ROOT/tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api"
ARTIFACTS="$ROOT/artifacts"
PORT="${I5_SMOKE_PORT:-18080}"
VENV="$API_DIR/.venv/bin/python"

mkdir -p "$ARTIFACTS"

if [[ ! -x "$VENV" ]]; then
  echo "Creating API venv for smoke test..."
  python3 -m venv "$API_DIR/.venv"
  "$API_DIR/.venv/bin/pip" install -q -r "$API_DIR/requirements-docker.txt"
fi

UVICORN="$API_DIR/.venv/bin/uvicorn"
PID=""

cleanup() {
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "$API_DIR"
"$UVICORN" src.main:app --host 127.0.0.1 --port "$PORT" >/dev/null 2>&1 &
PID=$!

for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

{
  echo "# I5 local smoke proof (pre-docker / fallback)"
  echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Same FastAPI app as container — uvicorn on port $PORT"
  echo
  echo "## GET /health"
  curl -fsS "http://127.0.0.1:${PORT}/health"
  echo
  echo
  echo "## POST /convert"
  curl -fsS -X POST "http://127.0.0.1:${PORT}/convert" \
    -H 'Content-Type: application/json' \
    -d '{"amount":25,"from_currency":"USD","to_currency":"GBP"}'
  echo
} | tee "$ARTIFACTS/curl-proof.txt"

echo "Wrote $ARTIFACTS/curl-proof.txt"
