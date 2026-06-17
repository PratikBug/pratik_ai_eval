# Reviewer guide

Quick start for evaluating this coding-agent task repository.

## Prerequisites

| Tool | Used by |
|------|---------|
| **Node.js 18+** | Reviewer UI (`frontend/`) |
| **Python 3.11+** | B*, I*, A4–A6 task scripts |
| **Rust (cargo)** | A3 polyglot engine, B6 CLI |
| **Docker** | D1 LocalStack, I5 container verify, optional A3 |
| **Terraform ≥ 1.5** | D1 plan/validate |

Install only what you need for the tasks you are reviewing.

## Start the reviewer UI

```bash
cd frontend
npm install   # first time only
npm run dev
```

Open http://localhost:5173 — browse tasks, read READMEs, and run live demos where available.

## Full verification

From the repo root:

```bash
bash scripts/verify-all.sh
```

Runs frontend unit tests plus task verify scripts (D1, A3 e2e, A4, A5, A6 benchmark, I5 docker). I5 is skipped with a clear message when Docker is unavailable. Exits non-zero if any step fails.

Individual task checks:

```bash
bash tasks/d1-terraform-plan-for-a-small-service/scripts/verify.sh
bash tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/scripts/e2e.sh
bash tasks/a4-repository-modernization-plan-with-executable-first-step/scripts/verify.sh
bash tasks/a5-agent-code-review-and-adversarial-verification/scripts/verify.sh
bash tasks/a6-performance-profiling-and-targeted-improvement/scripts/benchmark.sh
bash tasks/i5-dockerize-and-run/scripts/verify-docker.sh   # requires Docker
bash tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/scripts/e2e.sh  # requires Docker
```

## Task verification modes

### Live UI demo (browser + Vite dev server)

B1–B6, I1–I6, A2–A6, **D1**, **D2** — interactive panels on each task page. Most spawn local scripts via `/api/*` routes registered in `frontend/vite.config.ts`. Requires `npm run dev`.

### Script-only (no UI runner)

A3 e2e, A4/A5 verify, A6 benchmark, D1 verify, D2 e2e — run shell scripts directly or via `scripts/verify-all.sh`. Artifacts land under each task’s `artifacts/` folder.

### Artifacts-only (static proof)

A1, and any task where the deliverable is a report/plan without a live runner. The UI shows saved files from `artifacts/` and architecture diagrams; no re-run button.

### Pending tasks

D2–D6, etc. — placeholder architecture preview only until implemented (D2 is done with live demo).

## D1 Terraform (DevOps)

- **Stack:** S3 (versioned) + Lambda (Python upload handler) + API Gateway `POST /upload` + IAM, planned against **LocalStack** (`localhost:4566`).
- **UI:** Open task D1 → **Re-run verify** runs `scripts/verify.sh` and refreshes `terraform-validate.txt` and `terraform-plan.txt`.
- **CLI:** `bash tasks/d1-terraform-plan-for-a-small-service/scripts/verify.sh`

No real AWS credentials required when `use_localstack = true` (default).
