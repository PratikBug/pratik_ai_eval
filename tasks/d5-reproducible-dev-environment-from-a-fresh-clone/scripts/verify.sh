#!/usr/bin/env bash
# D5 — run bootstrap and capture artifacts for reviewers.
set -euo pipefail

TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "${TASK_DIR}/../.." && pwd)"
ARTIFACTS="${TASK_DIR}/artifacts"
BOOTSTRAP_LOG="${ARTIFACTS}/bootstrap-log.txt"
TEST_LOG="${ARTIFACTS}/test-output.txt"

mkdir -p "${ARTIFACTS}"

log() { echo "[d5-verify] $*"; }

: > "${BOOTSTRAP_LOG}"
: > "${TEST_LOG}"

log "Running make bootstrap from ${ROOT}"
{
  echo "=== make bootstrap ==="
  echo "cwd: ${ROOT}"
  echo "date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
  cd "${ROOT}"
  make bootstrap
} 2>&1 | tee "${BOOTSTRAP_LOG}"

# Extract test section from bootstrap log
{
  echo "=== test output (extracted) ==="
  awk '/\[d5-test\]|pytest|vitest|ruff|PASS|FAIL|passed|failed/' "${BOOTSTRAP_LOG}" || true
  echo
  tail -40 "${BOOTSTRAP_LOG}"
} > "${TEST_LOG}"

log "Artifacts:"
log "  ${BOOTSTRAP_LOG}"
log "  ${TEST_LOG}"
log "  ${ARTIFACTS}/implicit-deps.md"
log "SUCCESS"
