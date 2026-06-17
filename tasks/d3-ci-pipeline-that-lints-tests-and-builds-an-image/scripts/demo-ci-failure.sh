#!/usr/bin/env bash
# D3 — deliberately break lint, run act lint job, capture failure log, restore file.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="${TASK_DIR}/artifacts"
WORKFLOW="${ROOT}/.github/workflows/ci.yml"
ACT_IMAGE="${ACT_RUNNER_IMAGE:-catthehacker/ubuntu:act-full}"
TARGET="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api/src/main.py"
MARKER="# ci-failure-demo-d3"

log() {
  echo "[d3-failure-demo] $*"
}

cleanup() {
  if [[ -f "${TARGET}.bak" ]]; then
    mv "${TARGET}.bak" "${TARGET}"
    log "Restored ${TARGET}"
  fi
}
trap cleanup EXIT

if ! command -v act >/dev/null 2>&1; then
  echo "ERROR: act not found. Install: brew install act" >&2
  exit 1
fi

mkdir -p "${ARTIFACTS}"
cp "${TARGET}" "${TARGET}.bak"

log "Injecting deliberate ruff violation into D2 API"
cat >> "${TARGET}" <<EOF

${MARKER}
import sys  # unused import for CI failure demo
EOF

log "Running act lint job (expected to fail)"
set +e
{
  echo "# D3 CI act run — failure demo (lint job)"
  echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Injected unused import into api/src/main.py"
  echo
  cd "${ROOT}"
  act push -W "${WORKFLOW}" -j lint \
    -P "ubuntu-latest=${ACT_IMAGE}" \
    --container-architecture linux/amd64
} 2>&1 | tee "${ARTIFACTS}/ci-failure-log.txt"
ACT_EXIT=$?
set -e

if [[ "${ACT_EXIT}" -eq 0 ]]; then
  echo "ERROR: expected lint job to fail but act exited 0" >&2
  exit 1
fi

log "Artifact written: ${ARTIFACTS}/ci-failure-log.txt"
log "SUCCESS — failure demo captured (act exit ${ACT_EXIT})"
