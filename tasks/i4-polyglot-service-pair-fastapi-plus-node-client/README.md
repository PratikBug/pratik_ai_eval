# I4 — Polyglot Service Pair: FastAPI plus Node Client

**Time box:** 90 minutes  
**Status:** Done

## Goal

FastAPI `/convert` endpoint with Node.js CLI client, hardcoded rates, validation, tests on both sides, and two-terminal README.

## Architecture

```
Node CLI (client/)  --POST /convert-->  FastAPI (api/)  --hardcoded rates-->
```

| Component | Port | Path |
|-----------|------|------|
| FastAPI service | **8768** | `api/src/main.py` |
| Node CLI | — | `client/src/cli.ts` |

## Supported currencies (hardcoded USD-equivalent rates)

| Code | Rate (1 unit → USD) |
|------|---------------------|
| USD | 1.0 |
| EUR | 1.09 |
| GBP | 1.27 |
| INR | 0.012 |

## API contract

**POST `/convert`**

```json
{
  "amount": 100,
  "from_currency": "USD",
  "to_currency": "EUR"
}
```

**Response 200**

```json
{
  "amount": 100,
  "from_currency": "USD",
  "to_currency": "EUR",
  "converted_amount": 91.7431,
  "rate": 0.917431
}
```

**Validation errors:** `422` for invalid body (amount ≤ 0, unknown currency).

**GET `/health`** — `{ "status": "ok" }`  
**GET `/rates`** — list hardcoded rates

## Two-terminal run instructions

### Terminal 1 — start FastAPI

```bash
cd tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --host 127.0.0.1 --port 8768
```

### Terminal 2 — run Node CLI client

```bash
cd tasks/i4-polyglot-service-pair-fastapi-plus-node-client/client
npm install
npm run convert -- 100 USD EUR
```

Expected output:

```
100 USD = 91.7431 EUR (rate 0.917431)
```

Custom base URL:

```bash
npm run convert -- 50 GBP INR --base-url http://127.0.0.1:8768
```

### Scripted verification (API must be running)

```bash
cd client
npm run verify
```

## Tests

**Service (pytest):**

```bash
cd api && source .venv/bin/activate && pytest -v
```

**Client (vitest, mocked HTTP):**

```bash
cd client && npm test
```

See [`artifacts/run-proof.txt`](artifacts/run-proof.txt) for captured results.

## Reviewer UI

```bash
cd frontend && npm run dev
```

Open task **I4** — health check, live convert form, run API/client tests, CLI demo.

## curl smoke test

```bash
curl -s -X POST http://127.0.0.1:8768/convert \
  -H 'Content-Type: application/json' \
  -d '{"amount":25,"from_currency":"USD","to_currency":"GBP"}' | jq .
```
