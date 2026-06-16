#!/usr/bin/env bash
# I5 — build, run, and curl-proof the convert API container.
# Writes tasks/i5-dockerize-and-run/artifacts/build-proof.txt and curl-proof.txt
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
API_CTX="$REPO_ROOT/tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api"
DOCKERFILE="$ROOT/Dockerfile"
ARTIFACTS="$ROOT/artifacts"
IMAGE="${I5_IMAGE:-pratik-i5-convert-api:local}"
HOST_PORT="${I5_HOST_PORT:-8080}"
CONTAINER_NAME="${I5_CONTAINER_NAME:-i5-convert-api-verify}"

mkdir -p "$ARTIFACTS"

log() {
  echo "[i5-verify] $*"
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker CLI not found. Install Docker Desktop and re-run." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "ERROR: docker daemon is not running. Start Docker Desktop and re-run." >&2
    exit 1
  fi
}

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

require_docker

log "Building image $IMAGE"
{
  echo "# I5 Docker build proof"
  echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Command: docker build -f $DOCKERFILE -t $IMAGE $API_CTX"
  echo
  docker build -f "$DOCKERFILE" -t "$IMAGE" "$API_CTX"
} 2>&1 | tee "$ARTIFACTS/build-proof.txt"

log "Starting container on port $HOST_PORT"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER_NAME" -p "${HOST_PORT}:8080" "$IMAGE" >/dev/null

log "Waiting for health"
ready=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${HOST_PORT}/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "ERROR: service did not become healthy on port $HOST_PORT" >&2
  docker logs "$CONTAINER_NAME" >&2 || true
  exit 1
fi

{
  echo "# I5 Docker curl / health proof"
  echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Container: $CONTAINER_NAME"
  echo
  echo "## docker ps"
  docker ps --filter "name=$CONTAINER_NAME"
  echo
  echo "## docker inspect health"
  docker inspect --format='{{json .State.Health}}' "$CONTAINER_NAME" 2>/dev/null || echo "(health pending — Dockerfile HEALTHCHECK active)"
  echo
  echo "## GET /health"
  curl -fsS "http://127.0.0.1:${HOST_PORT}/health"
  echo
  echo
  echo "## POST /convert"
  curl -fsS -X POST "http://127.0.0.1:${HOST_PORT}/convert" \
    -H 'Content-Type: application/json' \
    -d '{"amount":100,"from_currency":"USD","to_currency":"EUR"}'
  echo
  echo
  echo "## GET /rates (excerpt)"
  curl -fsS "http://127.0.0.1:${HOST_PORT}/rates"
  echo
} | tee "$ARTIFACTS/curl-proof.txt"

log "Proof artifacts written to $ARTIFACTS"
log "SUCCESS — container healthy and API responded"
