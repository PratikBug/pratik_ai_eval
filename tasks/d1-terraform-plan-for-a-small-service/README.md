# D1 — Terraform Plan for a Small Service

**Time box:** 60 minutes  
**Status:** Done

## Goal

Terraform for a small AWS stack (S3 + Lambda + API Gateway) that passes `terraform validate` and produces a clean `terraform plan` against **LocalStack** — no real AWS account or credentials required.

## Stack

| Component | Role |
|-----------|------|
| **S3 bucket** | Stores uploaded JSON payloads from the API |
| **Lambda** | Python handler receives API Gateway proxy events and writes to S3 |
| **API Gateway** | `POST /upload` → Lambda (AWS_PROXY integration) |
| **IAM** | Lambda execution role with least-privilege S3 access |

**Why LocalStack?** The spec requires a local or test backend with no real cloud spend. LocalStack emulates AWS APIs on `localhost:4566` using dummy `test`/`test` credentials. You do **not** need AWS SSO, `aws configure`, or an S3 login in the real console.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5 (`brew install hashicorp/tap/terraform`)
- [Docker](https://docs.docker.com/get-docker/) (or Colima: `brew install colima docker && colima start`)

## Quick verify (recommended)

```bash
cd tasks/d1-terraform-plan-for-a-small-service
bash scripts/verify.sh
```

This starts LocalStack, runs `terraform init`, `validate`, and `plan`, and writes artifacts to `artifacts/`.

## Manual steps

### 1. Start LocalStack

```bash
cd tasks/d1-terraform-plan-for-a-small-service
docker-compose up -d
# wait until healthy:
curl -sf http://127.0.0.1:4566/_localstack/health
```

### 2. Initialize and validate

```bash
cd terraform
terraform init
terraform validate
```

### 3. Plan (against LocalStack — no real AWS)

```bash
terraform plan -out=../artifacts/tfplan
```

Default variables point the AWS provider at `http://127.0.0.1:4566` with `use_localstack = true` and skip credential checks. **A clean `terraform plan` runs without real AWS credentials** — state uses the local backend and the provider does not call live AWS APIs for an empty-state plan. Start LocalStack (above) before `apply` if you want resources created in the emulator.

### 4. Apply (optional — still LocalStack only)

```bash
terraform apply ../artifacts/tfplan
```

After apply, outputs include the API invoke URL and bucket name:

```bash
terraform output
```

### 5. Destroy

```bash
terraform destroy
```

### 6. Stop LocalStack

```bash
cd ..
docker-compose down
```

## Real AWS (not required for this eval)

To target real AWS instead of LocalStack, pass:

```bash
terraform plan -var="use_localstack=false"
```

You would then need valid AWS credentials (environment variables or IAM role) and accept real cloud spend. **This eval task does not require that path.**

## Deliverables

| Artifact | Description |
|----------|-------------|
| `terraform/*.tf` | Provider, backend, variables, S3 + Lambda + API Gateway |
| `lambda/handler.py` | Minimal upload handler |
| `docker-compose.yml` | LocalStack for local verification |
| `scripts/verify.sh` | One-command init / validate / plan |
| `artifacts/terraform-validate.txt` | Captured validate output |
| `artifacts/terraform-plan.txt` | Captured plan output |

## File layout

```
d1-terraform-plan-for-a-small-service/
├── README.md
├── docker-compose.yml
├── lambda/handler.py
├── scripts/verify.sh
├── terraform/
│   ├── versions.tf      # Terraform + provider pins, local backend
│   ├── variables.tf
│   ├── providers.tf     # AWS provider → LocalStack when use_localstack=true
│   ├── main.tf          # S3, Lambda, API Gateway, IAM
│   └── outputs.tf
└── artifacts/
    ├── terraform-validate.txt
    ├── terraform-plan.txt
    └── lambda.zip         # built by archive provider during plan
```
