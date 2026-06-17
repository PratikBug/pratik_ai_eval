#!/usr/bin/env bash
# D4 — tear down manifests and optionally delete the kind cluster.
set -euo pipefail

TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="${TASK_DIR}/k8s"
CLUSTER_NAME="${D4_KIND_CLUSTER:-d4-jobs}"
DELETE_CLUSTER="${D4_DELETE_CLUSTER:-0}"

log() { echo "[d4-down] $*"; }

if ! command -v kubectl >/dev/null 2>&1; then
  echo "ERROR: kubectl required" >&2
  exit 1
fi

if kubectl config get-contexts -o name 2>/dev/null | grep -qx "kind-${CLUSTER_NAME}"; then
  kubectl config use-context "kind-${CLUSTER_NAME}" >/dev/null 2>&1 || true
  log "Deleting manifests"
  kubectl delete -f "${K8S_DIR}/" --ignore-not-found --wait=false || true
else
  log "Context kind-${CLUSTER_NAME} not found — skip kubectl delete"
fi

if [[ "${DELETE_CLUSTER}" == "1" ]] && command -v kind >/dev/null 2>&1; then
  if kind get clusters 2>/dev/null | grep -qx "${CLUSTER_NAME}"; then
    log "Deleting kind cluster '${CLUSTER_NAME}'"
    kind delete cluster --name "${CLUSTER_NAME}"
  fi
fi

log "Done. Set D4_DELETE_CLUSTER=1 to remove the kind cluster entirely."
