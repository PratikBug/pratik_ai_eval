#!/usr/bin/env bash
# Run frontend tests and each task verify script that exists.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

run_step() {
  local label="$1"
  shift
  echo
  echo "==> ${label}"
  if "$@"; then
    echo "OK: ${label}"
  else
    echo "FAIL: ${label}" >&2
    FAILED=1
  fi
}

echo "Eval repo verification — ${ROOT}"

run_step "Frontend unit tests (npm test)" bash -c "cd \"${ROOT}/frontend\" && npm test"

run_step "D1 terraform verify" bash "${ROOT}/tasks/d1-terraform-plan-for-a-small-service/scripts/verify.sh"

run_step "A3 polyglot e2e" bash "${ROOT}/tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/scripts/e2e.sh"

run_step "A4 modernization verify" bash "${ROOT}/tasks/a4-repository-modernization-plan-with-executable-first-step/scripts/verify.sh"

run_step "A5 code review verify" bash "${ROOT}/tasks/a5-agent-code-review-and-adversarial-verification/scripts/verify.sh"

run_step "A6 performance benchmark" bash "${ROOT}/tasks/a6-performance-profiling-and-targeted-improvement/scripts/benchmark.sh"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  run_step "I5 docker verify" bash "${ROOT}/tasks/i5-dockerize-and-run/scripts/verify-docker.sh"
else
  echo
  echo "==> I5 docker verify"
  echo "SKIP: Docker is not available on this machine (install Docker or start Colima)."
fi

echo
if [[ "${FAILED}" -ne 0 ]]; then
  echo "Verification finished with failures." >&2
  exit 1
fi

echo "All verification steps passed."
