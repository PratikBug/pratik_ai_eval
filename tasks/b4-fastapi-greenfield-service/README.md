# B4 — FastAPI Greenfield Service

**Time box:** 60 minutes  
**Status:** Done

## Goal

Build a small Python FastAPI service with POST/GET `/transactions`, GET `/balance`, input validation, at least 3 tests, and README.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/transactions` | Record a credit or debit |
| GET | `/transactions` | List all transactions |
| GET | `/balance` | Current balance (credits − debits) |

### POST `/transactions` body

```json
{
  "amount": "100.50",
  "type": "credit",
  "description": "Optional note"
}
```

Validation:
- `amount` — required, must be **> 0**, max 12 digits / 2 decimal places
- `type` — required, `"credit"` or `"debit"`
- `description` — optional, max 200 characters

## Install

```bash
cd tasks/b4-fastapi-greenfield-service
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
source .venv/bin/activate
uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/docs for the interactive Swagger UI.

## Reviewer UI demo

With `npm run dev` running in `frontend/`, open task **B4** in the reviewer app. The live demo:

- Starts uvicorn automatically (proxied at `/api/b4/service/*`)
- Lets you POST/GET transactions and view balance
- Runs **pytest** live via **Run pytest suite**

Prerequisite: create the B4 venv once (see Install above).

### Example requests

```bash
curl -X POST http://127.0.0.1:8000/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount":"100.00","type":"credit","description":"Opening deposit"}'

curl http://127.0.0.1:8000/transactions
curl http://127.0.0.1:8000/balance
```

## Test

```bash
source .venv/bin/activate
pytest -v
```

Five tests cover create, list, balance math, and validation errors (invalid amount and type).

## Project layout

```
tasks/b4-fastapi-greenfield-service/
├── src/
│   ├── main.py       # FastAPI app and routes
│   ├── schemas.py    # Pydantic request/response models
│   └── store.py      # In-memory transaction store
├── tests/
│   └── test_api.py   # pytest + TestClient
├── artifacts/
│   └── run-proof.txt # curl + pytest proof
├── requirements.txt
└── pytest.ini
```

## Deliverables

- [`src/`](src/) — FastAPI application
- [`tests/`](tests/) — 5 automated tests
- [`artifacts/run-proof.txt`](artifacts/run-proof.txt) — live run proof
