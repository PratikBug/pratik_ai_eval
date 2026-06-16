# A1: Multi-Worktree Parallel Plan

## Feature Task
Build an Expense Tracker REST API with three endpoints:
POST /transactions, GET /transactions, GET /balance.

## Why this splits cleanly
The feature has three genuinely independent layers:
1. Data layer (models, DB, migrations)
2. API layer (routes, validation, app wiring)
3. Test layer (fixtures, test cases, test config)

Each lane touches a different set of files. There is no circular dependency
at development time — the test lane can mock what it needs.

---

## Task Decomposition

### Lane 1 — Data Layer
**Branch:** `feat/data-layer`
**Owns:** `app/models.py`, `app/database.py`, `app/config.py`
**Delivers:** SQLAlchemy Transaction model, DB session factory, SQLite setup
**Must NOT touch:** `app/routes/`, `tests/`

### Lane 2 — API Endpoints
**Branch:** `feat/api-endpoints`
**Owns:** `app/routes/transactions.py`, `app/routes/balance.py`, `app/main.py`
**Delivers:** FastAPI app, all three routes, Pydantic request/response schemas
**Must NOT touch:** `app/models.py`, `app/database.py`, `tests/`
**Assumes:** Model shape from SHARED_CONTRACT.md (stubs if needed)

### Lane 3 — Test Suite
**Branch:** `feat/tests`
**Owns:** `tests/conftest.py`, `tests/test_transactions.py`, `tests/test_balance.py`
**Delivers:** pytest fixtures, at least 5 tests covering all 3 endpoints
**Must NOT touch:** `app/` source files
**Assumes:** Routes and models match SHARED_CONTRACT.md

---

## Shared Constraints (apply to ALL lanes)

1. Python 3.11, FastAPI, SQLAlchemy, SQLite, pytest — no other frameworks
2. File paths must match SHARED_CONTRACT.md exactly
3. The Transaction model shape is frozen: id, amount, category, description, created_at
4. No lane may change the API contract (routes, methods, response shape)
5. Every lane must leave the repo in a committable state with no syntax errors
6. No lane installs packages not in requirements.txt (maintain one shared file)
7. All imports must use the `app.` prefix (e.g. `from app.models import Transaction`)

---

## Agent Prompt — Lane 1 (Data Layer)

```
You are working on branch feat/data-layer of the expense-tracker repo.

Your job: implement the data layer only.

Files to create:
- app/__init__.py (empty)
- app/config.py — DATABASE_URL = "sqlite:///./expense.db"
- app/database.py — SQLAlchemy engine, SessionLocal, Base, get_db dependency
- app/models.py — Transaction model with fields: id, amount, category, description, created_at

Rules:
- Do NOT create any route files or test files
- Do NOT create app/main.py
- Use SQLAlchemy ORM (not Core)
- created_at must default to datetime.utcnow
- amount must be Float, category must be String, description nullable String
- Commit your work with: git commit -m "feat(data): add models and database setup"
```

---

## Agent Prompt — Lane 2 (API Endpoints)

```
You are working on branch feat/api-endpoints of the expense-tracker repo.

Your job: implement the FastAPI app and all API routes.

Files to create:
- app/__init__.py (empty)
- app/main.py — FastAPI app, include routers
- app/schemas.py — Pydantic schemas: TransactionCreate, TransactionResponse, BalanceResponse
- app/routes/__init__.py (empty)
- app/routes/transactions.py — POST /transactions, GET /transactions
- app/routes/balance.py — GET /balance (sum of all amounts)
- requirements.txt — fastapi, uvicorn, sqlalchemy, pydantic, pytest, httpx

Rules:
- Do NOT create models.py or database.py — import them from app.models and app.database
- If app.models does not exist yet, use a stub: from app.models import Transaction
- amount must be validated as > 0 (use Pydantic validator or Field(gt=0))
- All responses must match the contract in SHARED_CONTRACT.md
- Commit your work with: git commit -m "feat(api): add fastapi routes and schemas"
```

---

## Agent Prompt — Lane 3 (Test Suite)

```
You are working on branch feat/tests of the expense-tracker repo.

Your job: write the full pytest test suite.

Files to create:
- tests/__init__.py (empty)
- tests/conftest.py — TestClient fixture using in-memory SQLite, override get_db
- tests/test_transactions.py — tests for POST /transactions, GET /transactions
- tests/test_balance.py — tests for GET /balance

Required tests (minimum 5):
1. POST /transactions returns 201 with valid payload
2. POST /transactions returns 422 with missing amount
3. POST /transactions returns 422 with amount <= 0
4. GET /transactions returns list (may be empty)
5. GET /balance returns correct sum after one transaction

Rules:
- Do NOT modify any app/ source files
- Use httpx TestClient (from starlette.testclient import TestClient)
- Use an in-memory SQLite DB in conftest (DATABASE_URL = "sqlite:///./test.db")
- All tests must be independent (set up and tear down their own data)
- Commit your work with: git commit -m "feat(tests): add pytest suite"
```

---

## Merge Order

1. **feat/data-layer** → main first
   - Reason: routes and tests both depend on models and DB session
2. **feat/api-endpoints** → main second
   - Reason: tests depend on the running app
3. **feat/tests** → main last
   - Reason: tests import from both layers above

---

## Conflict Risk Plan

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Both Lane 1 and Lane 2 create `app/__init__.py` | High | Both create empty files — git will auto-merge or show a trivial conflict; accept either |
| requirements.txt diverges | Medium | Lane 2 owns requirements.txt; Lane 3 must not add new packages without coordinating |
| Model field name mismatch | High | SHARED_CONTRACT.md is the single source of truth; any lane that needs model info reads it |
| Import paths differ | Medium | All lanes must use `from app.models import ...` — enforced by shared constraint #7 |
| Port or config conflict | Low | Only one config.py (Lane 1 owns it); others import from it |

**On any merge conflict:**
1. Open the conflicted file
2. Keep the version that matches SHARED_CONTRACT.md
3. Run `pytest` after each merge to catch breakage early

---

## Verification Plan

After all three branches are merged into main, run the following in order:

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Run all tests
```bash
pytest tests/ -v
```
Expected: 5+ tests, all green.

### 3. Start the server
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Smoke test endpoints
```bash
# Create a transaction
curl -X POST http://localhost:8000/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount": 42.5, "category": "food", "description": "lunch"}'

# List transactions
curl http://localhost:8000/transactions

# Check balance
curl http://localhost:8000/balance
```
Expected: valid JSON responses matching SHARED_CONTRACT.md shapes.

### 5. Confirm no leftover merge markers
```bash
grep -r "<<<<<<" . --include="*.py" && echo "CONFLICT MARKERS FOUND" || echo "Clean"
```

### 6. Sign off
- [ ] All 5+ tests pass
- [ ] All 3 curl commands return valid JSON
- [ ] No merge conflict markers remain
- [ ] Git log shows 3 feature branch commits merged cleanly
