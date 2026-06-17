#!/usr/bin/env bash
# D4 — create kind cluster, build/load image, apply manifests.
set -euo pipefail

TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="${TASK_DIR}/k8s"
NAMESPACE="d4-jobs"

log() { echo "[d4-up] $*"; }

bash "${TASK_DIR}/scripts/ensure-cluster.sh"

log "Applying manifests"
kubectl apply -f "${K8S_DIR}/"

log "Waiting for postgres rollout"
kubectl rollout status deployment/postgres -n "${NAMESPACE}" --timeout=180s

log "Waiting for job-api rollout"
kubectl rollout status deployment/job-api -n "${NAMESPACE}" --timeout=180s

log "Pods:"
kubectl get pods -n "${NAMESPACE}" -o wide

log "Services:"
kubectl get svc -n "${NAMESPACE}"

log "SUCCESS — stack is up"
