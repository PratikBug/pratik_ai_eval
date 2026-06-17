#!/usr/bin/env bash
# D5 — run lint + tests (expects bootstrap deps to be installed).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
D2_API="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api"
D2_WORKER="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/worker"
FRONTEND="${ROOT}/frontend"
RUFF_VERSION="0.8.4"

log() { echo "[d5-test] $*"; }

run_mise() {
  if command -v mise >/dev/null 2>&1; then
    mise exec -- "$@"
  else
    "$@"
  fi
}

run_lint() {
  log "lint: ruff check D2 api/worker"
  if [[ -x "${D2_API}/.venv/bin/ruff" ]]; then
    "${D2_API}/.venv/bin/ruff" check "${D2_API}/src" "${D2_WORKER}/src"
  else
    run_mise python -m pip install -q "ruff==${RUFF_VERSION}"
    run_mise ruff check "${D2_API}/src" "${D2_WORKER}/src"
  fi
}

run_pytest() {
  log "test: pytest D2 API"
  if [[ ! -x "${D2_API}/.venv/bin/pytest" ]]; then
    echo "ERROR: D2 API venv not found. Run: make bootstrap" >&2
    exit 1
  fi
  cd "${D2_API}"
  .venv/bin/pytest tests/ -v
}

run_vitest() {
  log "test: frontend vitest"
  cd "${FRONTEND}"
  if [[ ! -x node_modules/.bin/vitest ]]; then
    echo "ERROR: frontend deps not installed. Run: make bootstrap" >&2
    exit 1
  fi
  NODE_ENV=development ./node_modules/.bin/vitest run
}

MODE="${1:-all}"

case "${MODE}" in
  lint)
    run_lint
    ;;
  all)
    run_lint
    run_pytest
    run_vitest
    log "SUCCESS — all tests passed"
    ;;
  *)
    echo "Usage: test.sh [lint|all]" >&2
    exit 1
    ;;
esac
