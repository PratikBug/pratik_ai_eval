#!/usr/bin/env bash
# D4 — validate manifests with kubectl dry-run and optional kubeval.
set -euo pipefail

TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="${TASK_DIR}/k8s"
ARTIFACTS="${TASK_DIR}/artifacts"

mkdir -p "${ARTIFACTS}"

log() { echo "[d4-validate] $*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: $1 is required but not installed." >&2
    echo "Install: brew install kubectl" >&2
    exit 1
  fi
}

require_cmd kubectl

OUTPUT="${ARTIFACTS}/dry-run-output.txt"
: > "${OUTPUT}"

HAS_CLUSTER=0
if kubectl cluster-info >/dev/null 2>&1; then
  HAS_CLUSTER=1
fi

log "kubectl dry-run -f ${K8S_DIR}/"
{
  echo "=== kubectl apply --dry-run=client ==="
  if [[ "${HAS_CLUSTER}" -eq 1 ]]; then
    kubectl apply --dry-run=client -f "${K8S_DIR}/"
  else
    echo "SKIP: no cluster — run ensure-cluster.sh first for client dry-run"
  fi
  echo
  echo "=== kubectl apply --dry-run=server ==="
  if [[ "${HAS_CLUSTER}" -eq 1 ]]; then
    # Namespace must exist for server dry-run of namespaced resources.
    kubectl apply -f "${K8S_DIR}/00-namespace.yaml"
    kubectl apply --dry-run=server -f "${K8S_DIR}/"
  else
    echo "SKIP: no cluster context"
  fi
  echo
  if command -v kubeval >/dev/null 2>&1; then
    echo "=== kubeval ==="
    kubeval --ignore-missing-schemas "${K8S_DIR}"/*.yaml
  else
    echo "=== kubeval ==="
    echo "SKIP: kubeval not installed (optional — brew install kubeval)"
  fi
} 2>&1 | tee "${OUTPUT}"

log "Wrote ${OUTPUT}"
