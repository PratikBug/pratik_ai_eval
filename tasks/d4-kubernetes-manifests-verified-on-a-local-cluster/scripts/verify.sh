#!/usr/bin/env bash
# D4 — full verify: cluster, validate, deploy, curl proof via port-forward.
set -euo pipefail

TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="${TASK_DIR}/artifacts"
K8S_DIR="${TASK_DIR}/k8s"
NAMESPACE="d4-jobs"
LOCAL_PORT="${D4_LOCAL_PORT:-18090}"

mkdir -p "${ARTIFACTS}"

log() { echo "[d4-verify] $*"; }

APPLY_LOG="${ARTIFACTS}/apply-output.txt"
CURL_LOG="${ARTIFACTS}/curl-proof.txt"
: > "${APPLY_LOG}"
: > "${CURL_LOG}"

log "Step 1: ensure kind cluster + load image"
bash "${TASK_DIR}/scripts/ensure-cluster.sh" 2>&1 | tee -a "${APPLY_LOG}"

log "Step 2: validate manifests (dry-run)"
bash "${TASK_DIR}/scripts/validate.sh"

log "Step 3: apply manifests"
{
  echo "=== kubectl apply ==="
  kubectl apply -f "${K8S_DIR}/"
  echo
  echo "=== rollout status ==="
  kubectl rollout status deployment/postgres -n "${NAMESPACE}" --timeout=180s
  kubectl rollout status deployment/job-api -n "${NAMESPACE}" --timeout=180s
  kubectl get pods -n "${NAMESPACE}" -o wide
  kubectl get svc -n "${NAMESPACE}"
} 2>&1 | tee -a "${APPLY_LOG}"

log "Step 4: port-forward and curl"
PF_PID=""
cleanup() {
  if [[ -n "${PF_PID}" ]] && kill -0 "${PF_PID}" 2>/dev/null; then
    kill "${PF_PID}" 2>/dev/null || true
    wait "${PF_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

kubectl port-forward -n "${NAMESPACE}" svc/job-api "${LOCAL_PORT}:8090" >/dev/null 2>&1 &
PF_PID=$!

for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${LOCAL_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

{
  echo "=== kubectl get pods -n ${NAMESPACE} ==="
  kubectl get pods -n "${NAMESPACE}" -o wide
  echo
  echo "=== kubectl get svc -n ${NAMESPACE} ==="
  kubectl get svc -n "${NAMESPACE}"
  echo
  echo "=== curl /health ==="
  curl -fsS -w "\nHTTP %{http_code}\n" "http://127.0.0.1:${LOCAL_PORT}/health"
  echo
  echo "=== curl /jobs ==="
  curl -fsS -w "\nHTTP %{http_code}\n" "http://127.0.0.1:${LOCAL_PORT}/jobs"
  echo
} 2>&1 | tee "${CURL_LOG}"

log "Artifacts:"
log "  ${ARTIFACTS}/dry-run-output.txt"
log "  ${ARTIFACTS}/apply-output.txt"
log "  ${ARTIFACTS}/curl-proof.txt"
log "SUCCESS"
