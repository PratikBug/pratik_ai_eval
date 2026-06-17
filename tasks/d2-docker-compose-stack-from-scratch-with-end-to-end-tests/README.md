# D2 — docker-compose Stack with End-to-End Tests

**Time box:** 90 minutes  
**Status:** Done

## Goal

Stand up a multi-service stack (API + database + worker) with docker-compose, seed data, and a one-command script that runs the full E2E test suite against the running stack.

## Architecture

| Service | Image | Port | Role |
|---------|-------|------|------|
| **db** | `postgres:16-alpine` | 5432 (internal) | Postgres with schema + seed via `docker-entrypoint-initdb.d` |
| **api** | Custom FastAPI | **8090** (host) | HTTP ingress — create/list/get jobs |
| **worker** | Custom Python | — | Polls `pending` jobs, marks `processing` → `done` |

**Flow:** E2E tests → `POST /jobs` → API inserts row → worker picks job → updates status → E2E polls `GET /jobs/{id}` until `done`.

**Seed data:** Three pending jobs (`seed-import-orders`, `seed-send-notifications`, `seed-reconcile-balances`) loaded on first volume init.

## Quick verify (recommended)

```bash
cd tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests
bash scripts/e2e.sh | tee artifacts/e2e-output.txt
```

This script:

1. Tears down containers **and volumes** (`docker-compose down -v`)
2. Builds and starts the stack (`docker-compose up --build -d`)
3. Waits for API health (includes DB connectivity check)
4. Runs `pytest e2e/test_stack.py -v` against `http://127.0.0.1:8090`
5. Captures `artifacts/service-logs.txt` from `docker-compose logs api worker db`

## Manual commands

### Start stack

```bash
cd tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests
docker-compose up --build -d
curl -fsS http://127.0.0.1:8090/health
curl -fsS http://127.0.0.1:8090/jobs
```

### Teardown (clean re-up from zero)

```bash
bash scripts/teardown.sh
# equivalent: docker-compose down -v --remove-orphans
```

Postgres init scripts run **only on an empty volume** — always use `-v` when tearing down for a fresh seed.

### Re-run E2E twice (proves clean re-up)

```bash
bash scripts/e2e.sh | tee artifacts/e2e-output.txt
bash scripts/e2e.sh | tee artifacts/e2e-output.txt
```

Both runs should exit 0 with 4 passing tests.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + DB ping |
| GET | `/jobs` | List all jobs |
| GET | `/jobs/{id}` | Get job by UUID |
| POST | `/jobs` | Create job (`{"name":"..."}`) → status `pending` |

## E2E tests

| Test | Proves |
|------|--------|
| `test_health` | API up and DB connected |
| `test_seeded_jobs_visible` | Seed/fixture SQL ran |
| `test_post_job_eventually_done` | API → DB → worker chain for new jobs |
| `test_worker_processed_seeded_job` | Worker processed at least one seeded job |

## Deliverables

| File | Purpose |
|------|---------|
| [`docker-compose.yml`](docker-compose.yml) | Multi-service orchestration with healthchecks |
| [`api/Dockerfile`](api/Dockerfile) | FastAPI image |
| [`worker/Dockerfile`](worker/Dockerfile) | Worker image |
| [`db/init/001_schema.sql`](db/init/001_schema.sql) | Jobs table schema |
| [`db/init/002_seed.sql`](db/init/002_seed.sql) | Seed fixture data |
| [`e2e/test_stack.py`](e2e/test_stack.py) | E2E pytest suite |
| [`scripts/e2e.sh`](scripts/e2e.sh) | One-command full verify |
| [`scripts/teardown.sh`](scripts/teardown.sh) | Volume-clean shutdown |
| [`artifacts/e2e-output.txt`](artifacts/e2e-output.txt) | All-green test run output |
| [`artifacts/service-logs.txt`](artifacts/service-logs.txt) | Inter-service log proof |

## Inter-service log markers

Look for these in `artifacts/service-logs.txt`:

- **api:** `event=job_created job_id=... status=pending`
- **worker:** `event=job_picked job_id=... status=processing`
- **worker:** `event=job_completed job_id=... status=done`

## Reviewer UI

```bash
cd frontend && npm run dev
```

Open task **D2** — view saved artifacts and re-run `scripts/e2e.sh` from the browser (requires Docker on the host).

## Prerequisites

- Docker daemon running (Docker Desktop or Colima)
- `docker-compose` or `docker compose` plugin
- Python 3.11+ on host (e2e.sh creates `e2e/.venv` automatically)

### Colima + Zscaler / corporate SSL inspection

If `docker pull` fails with `x509: certificate signed by unknown authority`, Colima’s VM does not trust your network’s root CA (common with Zscaler):

```bash
bash scripts/fix-colima-certs.sh
bash scripts/e2e.sh | tee artifacts/e2e-output.txt
```

This exports **Zscaler Root CA** from the macOS keychain into Colima and runs `update-ca-certificates`. Alternatively, use **Docker Desktop** (its daemon usually inherits macOS trust store).

## Project layout

```
tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/
├── docker-compose.yml
├── api/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/main.py
├── worker/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/worker.py
├── db/init/
│   ├── 001_schema.sql
│   └── 002_seed.sql
├── e2e/
│   ├── requirements.txt
│   └── test_stack.py
├── scripts/
│   ├── e2e.sh
│   └── teardown.sh
└── artifacts/
    ├── e2e-output.txt
    └── service-logs.txt
```
