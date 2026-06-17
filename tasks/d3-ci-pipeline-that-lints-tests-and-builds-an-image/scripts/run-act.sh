#!/usr/bin/env bash
# D3 — run GitHub Actions workflow locally with act and capture green proof.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="${TASK_DIR}/artifacts"
WORKFLOW="${ROOT}/.github/workflows/ci.yml"
ACT_IMAGE="${ACT_RUNNER_IMAGE:-catthehacker/ubuntu:act-full}"

mkdir -p "${ARTIFACTS}"

log() {
  echo "[d3-act] $*"
}

require_act() {
  if ! command -v act >/dev/null 2>&1; then
    echo "ERROR: act not found. Install: brew install act" >&2
    exit 1
  fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running. Start Docker Desktop or Colima." >&2
    exit 1
  fi
}

require_act
require_docker

log "=== D3 CI local act run ==="
log "Workflow: ${WORKFLOW}"
log "Runner image: ${ACT_IMAGE}"
log

{
  echo "# D3 CI act run — passing pipeline proof"
  echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Command: act push -W ${WORKFLOW} -P ubuntu-latest=${ACT_IMAGE}"
  echo
  cd "${ROOT}"
  act push \
    -W "${WORKFLOW}" \
    -P "ubuntu-latest=${ACT_IMAGE}" \
    --container-architecture linux/amd64
} 2>&1 | tee "${ARTIFACTS}/ci-run-log.txt"

log "Artifact written: ${ARTIFACTS}/ci-run-log.txt"
log "SUCCESS — act pipeline passed"
