#!/usr/bin/env bash
# D5 — install deps from a simulated fresh clone and run the CI-equivalent test suite.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
D2_API="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api"
D2_WORKER="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/worker"
FRONTEND="${ROOT}/frontend"
RUFF_VERSION="0.8.4"

log() { echo "[d5-bootstrap] $*"; }

require_mise() {
  if ! command -v mise >/dev/null 2>&1; then
    echo "ERROR: mise is required but not installed." >&2
    echo "Install: brew install mise" >&2
    echo "Then add to shell: echo 'eval \"\$(mise activate bash)\"' >> ~/.bashrc" >&2
    exit 1
  fi
}

run_mise() {
  mise exec -- "$@"
}

require_mise

log "Trusting repo .mise.toml (required by mise on first run)"
cd "${ROOT}"
MISE_YES=1 mise trust "${ROOT}/.mise.toml"

log "Installing pinned tools (Node 20, Python 3.11)"
mise install

log "Simulating fresh clone — removing cached deps"
rm -rf "${FRONTEND}/node_modules"
rm -rf "${D2_API}/.venv"

log "Installing frontend deps (npm ci)"
cd "${FRONTEND}"
run_mise npm ci --ignore-scripts --silent

log "Creating D2 API venv and installing Python deps"
cd "${D2_API}"
run_mise python -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt -r requirements-dev.txt
.venv/bin/pip install -q "ruff==${RUFF_VERSION}"

log "Running test suite"
bash "${SCRIPT_DIR}/test.sh"

log "SUCCESS — bootstrap complete, all tests passed"
