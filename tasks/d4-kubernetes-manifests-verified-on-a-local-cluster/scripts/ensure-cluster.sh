#!/usr/bin/env bash
# D4 — ensure kind cluster exists and API image is loaded (no kubectl apply).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
D2_API="${ROOT}/tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api"
CLUSTER_NAME="${D4_KIND_CLUSTER:-d4-jobs}"
IMAGE="pratik-d2-job-api:d4"

log() { echo "[d4-cluster] $*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: $1 is required." >&2
    exit 1
  fi
}

require_cmd kubectl
require_cmd kind
require_cmd docker

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running (start Colima or Docker Desktop)." >&2
  exit 1
fi

if ! kind get clusters 2>/dev/null | grep -qx "${CLUSTER_NAME}"; then
  log "Creating kind cluster '${CLUSTER_NAME}'"
  kind create cluster --name "${CLUSTER_NAME}" --wait 120s
else
  log "Kind cluster '${CLUSTER_NAME}' already exists"
fi

kubectl config use-context "kind-${CLUSTER_NAME}" >/dev/null

if [[ -f "${TASK_DIR}/scripts/fix-kind-certs.sh" ]]; then
  bash "${TASK_DIR}/scripts/fix-kind-certs.sh" || log "WARN: fix-kind-certs skipped or failed"
fi

log "Building API image ${IMAGE}"
docker build -t "${IMAGE}" "${D2_API}"

log "Loading API image into kind"
kind load docker-image "${IMAGE}" --name "${CLUSTER_NAME}" || {
  log "WARN: kind load failed for ${IMAGE} — cluster may pull from registry if certs are fixed"
}

log "Cluster ready: kind-${CLUSTER_NAME}"
