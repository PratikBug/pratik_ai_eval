#!/usr/bin/env bash
# D6 — shared docker compose helpers.
set -euo pipefail

resolve_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  else
    echo "ERROR: docker compose or docker-compose not found." >&2
    exit 1
  fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker CLI not found." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "ERROR: docker daemon is not running." >&2
    exit 1
  fi
  resolve_compose
}
