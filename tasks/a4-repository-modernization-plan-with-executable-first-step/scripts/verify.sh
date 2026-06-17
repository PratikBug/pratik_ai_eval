#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SANDBOX="$ROOT/legacy-sandbox"
OUT="$ROOT/artifacts/verification-output.txt"

mkdir -p "$(dirname "$OUT")"

{
  echo "=== A4 verification — $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
  echo
  echo "--- legacy-sandbox pytest ---"
  cd "$SANDBOX"
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements-dev.txt
  fi
  .venv/bin/pytest tests/ -v
  echo
  echo "--- verification complete ---"
} 2>&1 | tee "$OUT"
