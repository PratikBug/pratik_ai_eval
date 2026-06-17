#!/usr/bin/env bash
# D2 — tear down stack and remove volumes for a clean re-up.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "ERROR: docker compose or docker-compose not found." >&2
  exit 1
fi

cd "${ROOT}"
"${COMPOSE[@]}" down -v --remove-orphans
echo "D2 stack torn down (containers and volumes removed)."
