#!/usr/bin/env bash
# D6 — tear down observability stack.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/_lib.sh
source "${ROOT}/scripts/_lib.sh"

log() { echo "[d6-down] $*"; }

require_docker
cd "${ROOT}"
log "Stopping stack"
"${COMPOSE[@]}" down
log "Done"
