#!/usr/bin/env bash
# D6 — full verify: up → load → capture metrics/logs → Prometheus query proof.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${ROOT}/../.." && pwd)"
ARTIFACTS="${ROOT}/artifacts"
D2_API="${REPO_ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api"

API_PORT="${D6_API_PORT:-8090}"
PROM_PORT="${D6_PROMETHEUS_PORT:-9090}"
API_URL="http://127.0.0.1:${API_PORT}"
PROM_URL="http://127.0.0.1:${PROM_PORT}"

mkdir -p "${ARTIFACTS}"

log() { echo "[d6-verify] $*"; }

LOAD_LOG="${ARTIFACTS}/load-output.txt"
METRICS_LOG="${ARTIFACTS}/metrics-sample.txt"
LOGS_LOG="${ARTIFACTS}/structured-log-sample.txt"
PANEL_JSON="${ARTIFACTS}/dashboard-panel.json"
DIFF_PATCH="${ARTIFACTS}/instrumentation-diff.patch"

: > "${LOAD_LOG}"
: > "${METRICS_LOG}"
: > "${LOGS_LOG}"

log "Saving instrumentation diff"
git -C "${REPO_ROOT}" diff -- "${D2_API}/src" "${D2_API}/requirements.txt" > "${DIFF_PATCH}" || true

log "Step 1: start stack"
bash "${ROOT}/scripts/up.sh" 2>&1 | tee -a "${LOAD_LOG}"

log "Step 2: generate traffic"
{
  echo "=== load.sh ==="
  bash "${ROOT}/scripts/load.sh"
} 2>&1 | tee -a "${LOAD_LOG}"

log "Step 3: wait for Prometheus scrape"
sleep 8

log "Step 4: capture /metrics sample"
{
  echo "=== curl ${API_URL}/metrics (first 40 lines) ==="
  curl -fsS "${API_URL}/metrics" | head -40
} > "${METRICS_LOG}"

log "Step 5: capture structured JSON logs"
{
  echo "=== docker compose logs api (JSON lines) ==="
  cd "${ROOT}"
  # shellcheck source=scripts/_lib.sh
  source "${ROOT}/scripts/_lib.sh"
  require_docker
  "${COMPOSE[@]}" logs --no-color api 2>/dev/null | grep '^{' | tail -20
} > "${LOGS_LOG}" || true

log "Step 6: query Prometheus for dashboard panel data"
QUERY='sum(rate(http_requests_total{job="job-api"}[1m]))'
ENCODED_QUERY="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))' "${QUERY}")"
curl -fsS "${PROM_URL}/api/v1/query?query=${ENCODED_QUERY}" | python3 -m json.tool > "${PANEL_JSON}"

log "Step 7: validate non-zero request rate"
RATE="$(python3 -c "
import json, sys
data = json.load(open('${PANEL_JSON}'))
results = data.get('data', {}).get('result', [])
if not results:
    sys.exit(1)
value = float(results[0]['value'][1])
print(value)
if value <= 0:
    sys.exit(2)
")"
log "Prometheus request rate: ${RATE} req/s"

log "Artifacts:"
log "  ${DIFF_PATCH}"
log "  ${LOAD_LOG}"
log "  ${METRICS_LOG}"
log "  ${LOGS_LOG}"
log "  ${PANEL_JSON}"
log "SUCCESS"
