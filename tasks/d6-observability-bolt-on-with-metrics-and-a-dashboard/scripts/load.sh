#!/usr/bin/env bash
# D6 — generate HTTP traffic against the instrumented job API.
set -euo pipefail

API_URL="${D6_API_URL:-http://127.0.0.1:8090}"
REQUESTS="${D6_LOAD_REQUESTS:-60}"

log() { echo "[d6-load] $*"; }

log "Target: ${API_URL} (${REQUESTS} iterations)"

ok=0
fail=0

for i in $(seq 1 "${REQUESTS}"); do
  if curl -fsS "${API_URL}/health" >/dev/null; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
  fi

  if curl -fsS "${API_URL}/jobs" >/dev/null; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
  fi

  if curl -fsS -X POST "${API_URL}/jobs" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"load-job-${i}\"}" >/dev/null; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
  fi

  sleep 0.1
done

log "Completed — ok=${ok} fail=${fail}"
if [[ "${fail}" -gt 0 ]]; then
  exit 1
fi
