#!/usr/bin/env bash
# D6 — start observability stack (API + Postgres + worker + Prometheus + Grafana).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/_lib.sh
source "${ROOT}/scripts/_lib.sh"

API_PORT="${D6_API_PORT:-8090}"
PROM_PORT="${D6_PROMETHEUS_PORT:-9090}"
API_URL="http://127.0.0.1:${API_PORT}"
PROM_URL="http://127.0.0.1:${PROM_PORT}"

log() { echo "[d6-up] $*"; }

require_docker
cd "${ROOT}"

log "Building and starting stack"
"${COMPOSE[@]}" up -d --build

log "Waiting for API at ${API_URL}"
for _ in $(seq 1 60); do
  if curl -sf "${API_URL}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -sf "${API_URL}/health" >/dev/null

log "Waiting for Prometheus at ${PROM_URL}"
for _ in $(seq 1 30); do
  if curl -sf "${PROM_URL}/-/ready" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -sf "${PROM_URL}/-/ready" >/dev/null

log "Services:"
"${COMPOSE[@]}" ps
log "SUCCESS — API ${API_URL}, Prometheus ${PROM_URL}, Grafana http://127.0.0.1:${D6_GRAFANA_PORT:-3000}"
