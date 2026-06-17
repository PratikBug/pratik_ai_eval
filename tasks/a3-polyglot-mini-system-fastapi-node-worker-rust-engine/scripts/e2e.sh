#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_PORT="${ENGINE_PORT:-8782}"
WORKER_PORT="${WORKER_PORT:-8781}"
API_PORT="${API_PORT:-8780}"

ENGINE_PID=""
WORKER_PID=""
API_PID=""

cleanup() {
  [[ -n "${API_PID}" ]] && kill "${API_PID}" 2>/dev/null || true
  [[ -n "${WORKER_PID}" ]] && kill "${WORKER_PID}" 2>/dev/null || true
  [[ -n "${ENGINE_PID}" ]] && kill "${ENGINE_PID}" 2>/dev/null || true
}
trap cleanup EXIT

wait_for_health() {
  local url="$1"
  local label="$2"
  for _ in $(seq 1 40); do
    if curl -sf "${url}" >/dev/null; then
      echo "  ${label} ready"
      return 0
    fi
    sleep 0.25
  done
  echo "  ${label} failed to become ready at ${url}" >&2
  return 1
}

echo "=== A3 polyglot fraud-score e2e ==="
echo

echo "[1/4] Rust engine unit tests"
(cd "${ROOT}/engine" && cargo test --quiet)
echo "  cargo test: OK"
echo

echo "[2/4] Node worker unit tests"
(cd "${ROOT}/worker" && npm test --silent)
echo "  vitest: OK"
echo

echo "[3/4] FastAPI unit tests"
(
  cd "${ROOT}/api"
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt
  fi
  .venv/bin/python -m pytest tests/ -q
)
echo "  pytest: OK"
echo

echo "[4/4] Live HTTP integration (engine -> worker -> api)"
(
  cd "${ROOT}/engine"
  ENGINE_PORT="${ENGINE_PORT}" cargo run --quiet -- serve &
  ENGINE_PID=$!
)
wait_for_health "http://127.0.0.1:${ENGINE_PORT}/health" "Rust engine"

(
  cd "${ROOT}/worker"
  ENGINE_URL="http://127.0.0.1:${ENGINE_PORT}/score" WORKER_PORT="${WORKER_PORT}" npm start --silent &
  WORKER_PID=$!
)
wait_for_health "http://127.0.0.1:${WORKER_PORT}/health" "Node worker"

(
  cd "${ROOT}/api"
  WORKER_URL="http://127.0.0.1:${WORKER_PORT}/internal/process" \
    .venv/bin/uvicorn src.main:app --host 127.0.0.1 --port "${API_PORT}" &
  API_PID=$!
)
wait_for_health "http://127.0.0.1:${API_PORT}/health" "FastAPI"

TX_ID="a3-e2e-$(date +%s)"
EVENT='{"transaction_id":"'"${TX_ID}"'","amount":150.0,"merchant_id":"m-42"}'

echo "  POST /events"
ACCEPTED="$(curl -sf -X POST "http://127.0.0.1:${API_PORT}/events" \
  -H "Content-Type: application/json" \
  -d "${EVENT}")"
echo "    ${ACCEPTED}"

echo "  GET /scores/${TX_ID}"
SCORE="$(curl -sf "http://127.0.0.1:${API_PORT}/scores/${TX_ID}")"
echo "    ${SCORE}"

echo
echo "E2E complete — all layers green."
