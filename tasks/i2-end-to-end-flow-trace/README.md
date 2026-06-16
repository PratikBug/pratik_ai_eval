# I2 — End-to-End Flow Trace

**Time box:** 45 minutes  
**Status:** Done

## Goal

Trace one endpoint, event, or cron job end-to-end with sequence diagram and uncertainty notes.

## Trace target

**`POST /transactions`** on the B4 FastAPI transaction ledger — from HTTP entry through Pydantic validation to in-memory store append and `201` JSON response.

Also documents the reviewer UI path: `B4FastApiDemo` → Vite proxy (`/api/b4/service`) → uvicorn.

## Deliverables

- [`artifacts/flow-trace.md`](artifacts/flow-trace.md) — entry point, step-by-step file/function path, dependencies, side effects, uncertainties
- [`artifacts/sequence-diagram.mmd`](artifacts/sequence-diagram.mmd) — Mermaid sequence diagram (Path A direct + Path B UI proxy)

## View in UI

```bash
cd frontend && npm run dev
```

Open task **I2** for the live flow-trace demo with rendered sequence diagram, or task **B4** to exercise the traced endpoint.

## Reproduce

```bash
cd tasks/b4-fastapi-greenfield-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --host 127.0.0.1 --port 8766

# Another terminal
curl -s -X POST http://127.0.0.1:8766/transactions \
  -H 'Content-Type: application/json' \
  -d '{"amount":"100.50","type":"credit","description":"I2 trace"}' | jq .

pytest -v tests/test_api.py::test_post_transaction_creates_record
```

For a **richer trace** (real DB, queues, auth middleware), pick an endpoint in an external repo (e.g. B1 demo `java_spring_2019`) and follow the same template in `artifacts/`.
