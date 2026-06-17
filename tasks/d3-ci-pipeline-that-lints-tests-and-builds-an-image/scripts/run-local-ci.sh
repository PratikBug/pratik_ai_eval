#!/usr/bin/env bash
# D3 — run CI stages locally without act (same steps as .github/workflows/ci.yml).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="${TASK_DIR}/artifacts"
D2_API="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api"
D2_WORKER="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/worker"

mkdir -p "${ARTIFACTS}"

log() { echo "[d3-local-ci] $*"; }

ensure_frontend_deps() {
  cd "${ROOT}/frontend"
  if [[ -x node_modules/.bin/vitest ]]; then
    log "  frontend deps OK (vitest present — skip npm ci while dev server may be running)"
    return 0
  fi
  NODE_ENV=development npm ci --ignore-scripts --silent
}

run_frontend_tests() {
  cd "${ROOT}/frontend"
  if [[ ! -x node_modules/.bin/vitest ]]; then
    echo "ERROR: vitest not found in frontend/node_modules/.bin" >&2
    echo "Run: cd frontend && npm ci" >&2
    exit 1
  fi
  NODE_ENV=development ./node_modules/.bin/vitest run
}

log "lint: ruff"
python3.11 -m pip install -q ruff==0.8.4
ruff check "${D2_API}/src" "${D2_WORKER}/src"

log "lint: frontend npm ci"
ensure_frontend_deps

log "test: pytest 3.11"
cd "${D2_API}"
if [[ ! -d .venv ]]; then python3.11 -m venv .venv; fi
.venv/bin/pip install -q -r requirements.txt -r requirements-dev.txt
.venv/bin/pytest tests/ -v

log "test: pytest 3.12"
PY312=$(mktemp -d)
python3.12 -m venv "${PY312}"
"${PY312}/bin/pip" install -q -r requirements.txt -r requirements-dev.txt
cd "${D2_API}" && PYTHONPATH=. "${PY312}/bin/pytest" tests/ -v
rm -rf "${PY312}"

log "test: frontend vitest"
run_frontend_tests

log "build: docker image"
docker build -t "pratik-d2-job-api:ci-local" "${D2_API}"

log "SUCCESS — all CI stages passed"
