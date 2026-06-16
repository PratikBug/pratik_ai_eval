# I5 — Dockerize and Run

**Time box:** 60 minutes  
**Status:** Done

## Goal

Containerize the I4 currency convert FastAPI service so it builds and runs cleanly in Docker with health check proof.

## Service containerized

**Target:** `tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api` — FastAPI app with `GET /health`, `POST /convert`, hardcoded FX rates.

| Property | Value |
|----------|-------|
| Image name | `pratik-i5-convert-api:latest` |
| Container port | **8080** |
| Health endpoint | `GET /health` → `{"status":"ok"}` |

## Quick start

### Option A — docker compose (recommended)

```bash
cd tasks/i5-dockerize-and-run
docker compose up --build
```

In another terminal:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS -X POST http://127.0.0.1:8080/convert \
  -H 'Content-Type: application/json' \
  -d '{"amount":100,"from_currency":"USD","to_currency":"EUR"}'
```

### Option B — docker build & run

```bash
# Build
docker build -f tasks/i5-dockerize-and-run/Dockerfile \
  -t pratik-i5-convert-api:latest \
  tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api

# Run
docker run --rm -p 8080:8080 --name i5-convert-api pratik-i5-convert-api:latest

# Health check
curl -fsS http://127.0.0.1:8080/health
```

### Automated verification

```bash
./tasks/i5-dockerize-and-run/scripts/verify-docker.sh
```

Writes:

- `artifacts/build-proof.txt` — full `docker build` log  
- `artifacts/curl-proof.txt` — container health + `/convert` curl output

**Without Docker:** `./scripts/smoke-local.sh` runs the same app via uvicorn for curl proof only.

## Deliverables

| File | Purpose |
|------|---------|
| [`Dockerfile`](Dockerfile) | Production image: slim Python, non-root user, HEALTHCHECK |
| [`docker-compose.yml`](docker-compose.yml) | One-command build + run + healthcheck |
| [`artifacts/build-proof.txt`](artifacts/build-proof.txt) | Build command + Dockerfile validation |
| [`artifacts/curl-proof.txt`](artifacts/curl-proof.txt) | Live `/health` and `/convert` responses |

## Dockerfile design notes

1. **Build context** is the I4 `api/` folder — only `src/` and `requirements-docker.txt` are copied (no dev deps, no `.venv`).
2. **Non-root** `app` user runs uvicorn.
3. **HEALTHCHECK** curls `/health` every 15s (matches compose healthcheck).
4. **Port 8080** inside container — map with `-p 8080:8080`.

## Reviewer UI

```bash
cd frontend && npm run dev
```

Open task **I5** — view Dockerfile, proofs, run verification script from the UI.

## Stop

```bash
cd tasks/i5-dockerize-and-run && docker compose down
```
