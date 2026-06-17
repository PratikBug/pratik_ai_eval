#!/usr/bin/env bash
# D2 — one-command E2E: teardown → up → health → pytest → log capture.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="${ROOT}/artifacts"
API_PORT="${D2_API_PORT:-8090}"
API_URL="http://127.0.0.1:${API_PORT}"

mkdir -p "${ARTIFACTS}"

log() {
  echo "[d2-e2e] $*"
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker CLI not found. Install Docker Desktop and re-run." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "ERROR: docker daemon is not running. Start Docker Desktop and re-run." >&2
    exit 1
  fi
  if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  else
    echo "ERROR: docker compose or docker-compose not found." >&2
    exit 1
  fi
}

wait_for_api() {
  for _ in $(seq 1 60); do
    if curl -sf "${API_URL}/health" >/dev/null 2>&1; then
      log "API healthy at ${API_URL}"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: API did not become healthy at ${API_URL}" >&2
  "${COMPOSE[@]}" -f "${ROOT}/docker-compose.yml" logs >&2 || true
  exit 1
}

require_docker

log "=== D2 docker-compose E2E ==="
log "Step 1/6 — teardown (clean slate, volumes removed)"
bash "${ROOT}/scripts/teardown.sh"

log "Step 2/6 — build and start stack"
cd "${ROOT}"
if ! "${COMPOSE[@]}" up --build -d 2>&1; then
  echo >&2
  echo "ERROR: docker compose up failed." >&2
  if docker pull postgres:16-alpine 2>&1 | grep -q "certificate signed by unknown authority"; then
    echo "TLS fix (Colima + Zscaler/corporate proxy): bash scripts/fix-colima-certs.sh" >&2
    echo "Then retry: bash scripts/e2e.sh | tee artifacts/e2e-output.txt" >&2
  fi
  exit 1
fi

log "Step 3/6 — wait for API health (includes DB connectivity)"
wait_for_api

log "Step 4/6 — install e2e deps and run pytest"
E2E_VENV="${ROOT}/e2e/.venv"
if [[ ! -d "${E2E_VENV}" ]]; then
  python3 -m venv "${E2E_VENV}"
fi
"${E2E_VENV}/bin/pip" install -q -r "${ROOT}/e2e/requirements.txt"
D2_API_URL="${API_URL}" "${E2E_VENV}/bin/pytest" "${ROOT}/e2e/test_stack.py" -v

log "Step 5/6 — capture service logs"
{
  echo "# D2 service logs — inter-service communication proof"
  echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Look for: event=job_created (api), event=job_picked / event=job_completed (worker)"
  echo
  "${COMPOSE[@]}" logs --no-color api worker db
} > "${ARTIFACTS}/service-logs.txt"

log "Step 6/6 — artifacts written"
log "  ${ARTIFACTS}/service-logs.txt"
log "SUCCESS — all E2E tests passed"
