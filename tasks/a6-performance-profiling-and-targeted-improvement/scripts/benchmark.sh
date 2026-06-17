#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/profile-target"
ARTIFACTS="$ROOT/artifacts"

mkdir -p "$ARTIFACTS"

cd "$TARGET"

echo "=== A6 benchmark: baseline (N+1) ===" | tee "$ARTIFACTS/baseline-output.txt"
python3 benchmark.py --mode baseline | tee -a "$ARTIFACTS/baseline-output.txt"

echo "" | tee -a "$ARTIFACTS/baseline-output.txt"
echo "=== A6 benchmark: after (batched) ===" | tee "$ARTIFACTS/after-output.txt"
python3 benchmark.py --mode after | tee -a "$ARTIFACTS/after-output.txt"

echo "" | tee -a "$ARTIFACTS/after-output.txt"
echo "=== A6 benchmark: comparison ===" | tee -a "$ARTIFACTS/after-output.txt"
python3 benchmark.py --mode both | tee -a "$ARTIFACTS/after-output.txt"

echo "" | tee -a "$ARTIFACTS/after-output.txt"
echo "=== A6 profile (cProfile on N+1 path) ===" | tee -a "$ARTIFACTS/baseline-output.txt"
python3 benchmark.py --mode profile | tee -a "$ARTIFACTS/baseline-output.txt"

echo "" | tee -a "$ARTIFACTS/after-output.txt"
echo "=== A6 behavior tests ===" | tee -a "$ARTIFACTS/after-output.txt"
python3 -m pytest -q | tee -a "$ARTIFACTS/after-output.txt"
