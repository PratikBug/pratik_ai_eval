# I2 — End-to-end flow trace (pratik_ai_eval)

**Root:** `/Users/pratikwarathe/pratik_ai_eval`  
**Scanned at:** 2026-06-17  
**Time box:** 45 minutes

## Trace target

| Field | Value |
|-------|-------|
| **Operation** | Create a ledger transaction (credit or debit) |
| **HTTP method & path** | `POST /transactions` |
| **Service** | B4 FastAPI transaction ledger |
| **Why this flow** | Richest end-to-end path in the eval repo: HTTP entry → validation → in-memory persistence → JSON response. Exercised by pytest, curl, and the reviewer UI (B4 demo). |

**Alternate entry (reviewer UI):** `POST /api/b4/service/transactions` via Vite dev-server proxy → same FastAPI handler (documented in §Path B below).

There are **no cron jobs** or **message consumers** in this repository.

---

## Entry point

### Path A — Direct HTTP (pytest, curl, API clients)

```
POST http://127.0.0.1:8766/transactions
Content-Type: application/json

{"amount": "100.50", "type": "credit", "description": "Opening deposit"}
```

| Item | Location |
|------|----------|
| ASGI app | `tasks/b4-fastapi-greenfield-service/src/main.py:6-10` — `app = FastAPI(...)` |
| Route registration | `tasks/b4-fastapi-greenfield-service/src/main.py:28-30` — `@app.post("/transactions")` |
| Handler | `create_transaction(payload: TransactionCreate) -> TransactionResponse` |

**Proof:** `tasks/b4-fastapi-greenfield-service/tests/test_api.py:19-30` — `test_post_transaction_creates_record`.

### Path B — Reviewer UI demo (browser)

| Step | File | Function / symbol |
|------|------|-------------------|
| 1 | `frontend/src/components/B4FastApiDemo.tsx:67-91` | `handleSubmit` — builds JSON payload, `fetch(POST .../transactions)` |
| 2 | `frontend/src/types/ledger.ts:50` | `B4_SERVICE_BASE = "/api/b4/service"` |
| 3 | `frontend/vite-plugin-b4-api.ts:189-199` | Middleware matches `/api/b4/service/*`, calls `startServer()` then `proxyToService` |
| 4 | `frontend/vite-plugin-b4-api.ts:113-148` | `proxyToService` — Node `http.request` to `127.0.0.1:8766` |
| 5 | (continues Path A) | Uvicorn → FastAPI → `create_transaction` |

---

## Step-by-step file and function path

| # | Layer | File | Function / class | Line(s) | Action |
|---|-------|------|------------------|---------|--------|
| 1 | HTTP server | uvicorn (spawned) | ASGI worker | — | Receives HTTP request, dispatches to FastAPI app |
| 2 | Framework routing | `src/main.py` | FastAPI route table | 28-30 | Matches `POST /transactions` to `create_transaction` |
| 3 | Request parsing | `src/schemas.py` | `TransactionCreate` (Pydantic) | 7-17 | Validates `amount` (>0, 2 dp), `type` (credit\|debit), optional `description` (≤200) |
| 3a | Validation failure | FastAPI / Pydantic | automatic 422 handler | — | Returns 422 if body invalid — see `test_api.py:57-66` |
| 4 | Controller | `src/main.py` | `create_transaction` | 29-30 | Delegates to `store.create(payload)` |
| 5 | Domain / persistence | `src/store.py` | `TransactionStore.create` | 25-39 | Builds `TransactionRecord`, assigns `id`, appends to `_records` |
| 6 | ID generation | `src/store.py` | `_next_id` | 19, 27, 32 | Auto-increment primary key |
| 7 | Response mapping | `src/store.py` | `TransactionResponse` construction | 34-39 | Maps record → API DTO |
| 8 | Serialization | `src/schemas.py` | `TransactionResponse` | 20-24 | Pydantic serializes to JSON |
| 9 | HTTP response | FastAPI | `response_model`, `status_code=201` | main.py:28 | Returns `201 Created` with JSON body |

### Post-create read path (UI refresh)

After a successful create, `B4FastApiDemo.refreshLedger()` (`B4FastApiDemo.tsx:29-43`) calls:

- `GET /api/b4/service/transactions` → `list_transactions()` → `store.list_all()` (`main.py:33-35`, `store.py:41-50`)
- `GET /api/b4/service/balance` → `get_balance()` → `store.balance()` (`main.py:38-40`, `store.py:52-59`)

These are **read** side effects (in-memory aggregation), not part of the write trace but shown in the demo UI.

---

## External dependencies

| Dependency | Role in this flow | Version source |
|------------|-------------------|----------------|
| **FastAPI** | HTTP routing, dependency injection, OpenAPI | `requirements.txt` |
| **Pydantic** | Request/response validation & serialization | via FastAPI |
| **Starlette** | ASGI HTTP layer (used by FastAPI) | transitive |
| **Uvicorn** | ASGI server hosting `src.main:app` | `requirements.txt`; spawned by vite plugin or CLI |
| **Node.js `http`** | Vite proxy only (Path B) | `vite-plugin-b4-api.ts:129` |

**Not used in this flow:** database drivers, ORM, Redis/RabbitMQ, external HTTP APIs, authentication middleware.

---

## DB, API, and queue side effects

| Side effect type | Present? | Detail |
|------------------|----------|--------|
| **Relational DB write** | No | No SQL, migrations, or ORM in repo (confirmed I1) |
| **In-memory state mutation** | **Yes** | `TransactionStore._records.append(record)` — `store.py:33` |
| **Counter mutation** | **Yes** | `TransactionStore._next_id += 1` — `store.py:32` |
| **Message queue publish** | No | — |
| **External API call** | No | — |
| **File system write** | No | Create flow does not touch disk |
| **Downstream HTTP (Path B only)** | Internal | Vite proxy → localhost:8766 (same process boundary, not external) |

**Effective persistence:** process-local Python list. Data is **lost** when the uvicorn process exits or `POST /reset` is called (`main.py:17-20`, `store.py:21-23`).

---

## Sequence diagram

See [`sequence-diagram.mmd`](sequence-diagram.mmd) — Mermaid `sequenceDiagram` covering Path A (direct) and Path B (reviewer UI proxy).

Render in [Mermaid Live Editor](https://mermaid.live) or the I2 task UI demo.

---

## Known uncertainty

| # | Area | Notes |
|---|------|-------|
| 1 | **No real database** | Side effect is an in-memory list, not durable storage. A production trace would continue to SQL/ORM layer — absent here. |
| 2 | **Concurrency / multi-worker** | `TransactionStore` has no locking. Uvicorn defaults to one worker; multiple workers or threads could race on `_next_id` and `_records`. |
| 3 | **Validation error shape** | FastAPI auto-generates 422 bodies; exact JSON schema depends on FastAPI/Pydantic version — not custom-handled in app code. |
| 4 | **Proxy startup timing** | Path B: first UI request may block on `waitForHealth()` (`vite-plugin-b4-api.ts:46-66`) while uvicorn compiles/starts — duration environment-dependent. |
| 5 | **B5 mirror** | Identical logical flow exists in `tasks/b5-nodejs-greenfield-api-or-cli/` (Express + Zod). This trace documents **B4 as canonical**; B5 differs only in framework (Express route → Zod → `store.ts`). |
| 6 | **AuthN / AuthZ** | No middleware; any client reaching the port can POST. Not documented as a gap in B4 scope. |
| 7 | **Decimal serialization** | `TransactionResponse.amount` serializes as JSON string (e.g. `"100.50"`) — Pydantic v2 `Decimal` encoding; clients must not assume numeric JSON type. |

---

## Reproduce

```bash
# Terminal 1 — start B4 API
cd tasks/b4-fastapi-greenfield-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --host 127.0.0.1 --port 8766

# Terminal 2 — exercise the traced endpoint
curl -s -X POST http://127.0.0.1:8766/transactions \
  -H 'Content-Type: application/json' \
  -d '{"amount":"100.50","type":"credit","description":"I2 trace"}' | jq .

curl -s http://127.0.0.1:8766/transactions | jq .
curl -s http://127.0.0.1:8766/balance | jq .

# Or run automated proof
cd tasks/b4-fastapi-greenfield-service && pytest -v tests/test_api.py::test_post_transaction_creates_record
```

**Via reviewer UI:** `cd frontend && npm run dev` → open task **B4** or **I2** → use live demo to POST a transaction.
