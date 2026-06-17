# D6 — Observability Bolt-on with Metrics and a Dashboard

**Time box:** 60 minutes  
**Status:** Done

## Goal

Structured JSON logging and a Prometheus `/metrics` endpoint on the D2 job API, plus a Prometheus + Grafana compose stack with a provisioned dashboard panel fed by real traffic.

## Run order

### One-command proof (recommended)

From repo root:

```bash
bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/verify.sh
```

**Note:** Stop the D2 stack first if port 8090 is in use:

```bash
bash tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/scripts/teardown.sh
```

### Manual steps

```bash
# 1. Start stack (API + worker + Postgres + Prometheus + Grafana)
bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/up.sh

# 2. Generate traffic
bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/load.sh

# 3. View dashboard
open http://localhost:3000/d/d6-job-api/d6-job-api   # admin/admin

# 4. Tear down
bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/down.sh
```

## Ports

| Service | Port | URL |
|---------|------|-----|
| Job API | 8090 | http://localhost:8090/health |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3000 | http://localhost:3000 |

Override with `D6_API_PORT`, `D6_PROMETHEUS_PORT`, `D6_GRAFANA_PORT`.

## Code changes (instrumentation)

Instrumented files under D2 API (see `artifacts/instrumentation-diff.patch`):

| File | Change |
|------|--------|
| `api/src/observability.py` | JSON logging, Prometheus metrics, request middleware |
| `api/src/main.py` | Mount `/metrics`, wire middleware |
| `api/requirements.txt` | Add `prometheus-client==0.21.1` |

Metrics exposed:

- `http_requests_total{method, path, status}`
- `http_request_duration_seconds{method, path}`
- `jobs_created_total`

## Stack layout

```
tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/
├── docker-compose.yml
├── prometheus/prometheus.yml
├── grafana/
│   ├── provisioning/datasources/prometheus.yml
│   ├── provisioning/dashboards/default.yml
│   └── dashboards/jobs-api.json
├── scripts/
│   ├── up.sh
│   ├── down.sh
│   ├── load.sh
│   └── verify.sh
└── artifacts/
    ├── instrumentation-diff.patch
    ├── load-output.txt
    ├── metrics-sample.txt
    ├── structured-log-sample.txt
    └── dashboard-panel.json
```

## Deliverables

| Deliverable | Artifact |
|-------------|----------|
| Code diff (logs + metrics) | `artifacts/instrumentation-diff.patch` |
| docker-compose + Prometheus/Grafana provisioning | `docker-compose.yml`, `prometheus/`, `grafana/` |
| Load script | `scripts/load.sh` → `artifacts/load-output.txt` |
| Dashboard panel live data (JSON) | `artifacts/dashboard-panel.json` |
| Structured log sample | `artifacts/structured-log-sample.txt` |
| `/metrics` sample | `artifacts/metrics-sample.txt` |

## Grafana dashboard

Dashboard **D6 Job API** (`grafana/dashboards/jobs-api.json`) includes one panel:

- **HTTP request rate (req/s)** — `sum(rate(http_requests_total{job="job-api"}[1m]))`

Datasource and dashboard are auto-provisioned on Grafana startup.

## Prerequisites

- Docker running (Colima or Docker Desktop)
- Ports 8090, 9090, 3000 available
- Corporate TLS: run D2 `fix-colima-certs.sh` if image pulls fail

## Reviewer UI

Open task **D6** in the reviewer UI (`npm run dev`) and click **Re-run verify** to execute the full proof pipeline.
