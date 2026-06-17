#!/usr/bin/env bash
# Run terraform init, validate, and plan against LocalStack.
set -euo pipefail

TASK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$TASK_DIR/terraform"
ARTIFACTS="$TASK_DIR/artifacts"

mkdir -p "$ARTIFACTS"

echo "==> Starting LocalStack (optional — plan works with provider skip flags if pull fails)"
if command -v docker >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$TASK_DIR/docker-compose.yml" up -d || echo "LocalStack start failed; continuing with dry-run plan."
  else
    docker compose -f "$TASK_DIR/docker-compose.yml" up -d || echo "LocalStack start failed; continuing with dry-run plan."
  fi
  if curl -sf http://127.0.0.1:4566/_localstack/health >/dev/null 2>&1; then
    echo "LocalStack is ready."
  else
    echo "LocalStack not reachable; terraform plan still runs against configured LocalStack endpoints."
  fi
else
  echo "docker not found — terraform plan uses LocalStack endpoint config without a live emulator."
fi

cd "$TF_DIR"

echo "==> terraform init"
terraform init -input=false

echo "==> terraform validate"
terraform validate | tee "$ARTIFACTS/terraform-validate.txt"

echo "==> terraform plan"
terraform plan -input=false -out="$ARTIFACTS/tfplan" | tee "$ARTIFACTS/terraform-plan.txt"

echo "Done. Artifacts:"
echo "  $ARTIFACTS/terraform-validate.txt"
echo "  $ARTIFACTS/terraform-plan.txt"
