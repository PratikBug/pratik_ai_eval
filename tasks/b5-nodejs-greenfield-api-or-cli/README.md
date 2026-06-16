# B5 — Node.js Greenfield API

**Time box:** 60 minutes  
**Status:** Done

## Goal

Same transaction ledger as **B4**, implemented as a Node.js **Express** API with Zod validation, Vitest tests, and a reviewer UI demo.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/transactions` | Record a credit or debit |
| GET | `/transactions` | List all transactions |
| GET | `/balance` | Current balance (credits − debits) |
| POST | `/reset` | Clear in-memory ledger (demo helper) |

### POST `/transactions` body

```json
{
  "amount": "100.50",
  "type": "credit",
  "description": "Optional note"
}
```

Validation (Zod):
- `amount` — required, must be **> 0**, up to 2 decimal places
- `type` — `"credit"` or `"debit"`
- `description` — optional, max 200 characters

Invalid payloads return **422** with a FastAPI-compatible `detail` array.

## Install

```bash
cd tasks/b5-nodejs-greenfield-api-or-cli
npm install
```

## Run

```bash
npm run dev
```

Listens on http://127.0.0.1:8767 by default (`PORT` env overrides).

### Example requests

```bash
curl -X POST http://127.0.0.1:8767/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount":"100.00","type":"credit","description":"Opening deposit"}'

curl http://127.0.0.1:8767/transactions
curl http://127.0.0.1:8767/balance
```

## Test

```bash
npm test
```

Twelve tests across money helpers, store, schemas, routes, and server config (5 API route tests mirror B4).

## Reviewer UI demo

With `npm run dev` in `frontend/`, open task **B5**. The live demo:

- Starts the Express API via `/api/b5/service/*` proxy
- Lets you POST/GET transactions and view balance
- Runs **Vitest** live via **Run Vitest suite**

Prerequisite: `npm install` in this task folder once.

## Project layout

```
tasks/b5-nodejs-greenfield-api-or-cli/
├── src/
│   ├── app.ts        # Express app + routes
│   ├── index.ts      # Server entry (port 8767)
│   ├── schemas.ts    # Zod models
│   ├── store.ts      # In-memory ledger
│   └── money.ts      # Amount parsing/formatting
├── tests/            # Vitest + supertest
├── artifacts/run-proof.txt
├── package.json
└── vitest.config.ts
```

## Comparison with B4

| | B4 (Python) | B5 (Node.js) |
|---|-------------|--------------|
| Framework | FastAPI | Express |
| Validation | Pydantic | Zod |
| Tests | pytest + TestClient | Vitest + supertest |
| Storage | In-memory | In-memory |
| Endpoints | Same | Same |

## Deliverables

- [`src/`](src/) — Express application
- [`tests/`](tests/) — 12 automated tests
- [`artifacts/run-proof.txt`](artifacts/run-proof.txt) — live run proof
