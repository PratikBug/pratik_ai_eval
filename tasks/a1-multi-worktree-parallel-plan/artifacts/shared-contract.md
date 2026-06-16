# Shared Contract — Expense Tracker API

Frozen contract used as the single source of truth before any parallel lane starts.
Referenced by every agent prompt in [parallel-plan.md](./parallel-plan.md).

## Data Model

### Transaction
| Field       | Type     | Required | Notes                        |
|-------------|----------|----------|------------------------------|
| id          | int      | yes      | Auto-increment primary key   |
| amount      | float    | yes      | Must be > 0                  |
| category    | string   | yes      | e.g. "food", "travel"        |
| description | string   | no       | Free text                    |
| created_at  | datetime | yes      | Set automatically on insert  |

## API Contract

| Method | Route            | Request Body                             | Response               |
|--------|------------------|------------------------------------------|------------------------|
| POST   | /transactions    | { amount, category, description? }       | Created Transaction    |
| GET    | /transactions    | —                                        | List of Transactions   |
| GET    | /balance         | —                                        | { balance: float }     |

## File Structure Convention
- Models live in: `app/models.py`
- Routes live in: `app/routes/`
- DB setup lives in: `app/database.py`
- Tests live in: `tests/`
- Config lives in: `app/config.py`

## Python version: 3.11
## Framework: FastAPI + SQLite (via SQLAlchemy)
## Test framework: pytest
## Port: 8000
