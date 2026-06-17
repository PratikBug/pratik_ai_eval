# A2 — Execute Two Parallel Worktrees

**Time box:** 90 minutes  
**Status:** Done

## Goal

Create two parallel git worktrees, make independent changes in each lane, merge cleanly on `main`, and prove reconciliation with tests.

## Feature

**Expense Tracker REST API** — built from two parallel lanes:

| Lane | Branch | Delivers |
|------|--------|----------|
| A — Data | `feat/a2-data-layer` | SQLAlchemy models, DB session, config |
| B — API | `feat/a2-api-endpoints` | FastAPI routes, schemas, requirements.txt |

Tests were added on `main` after both merges (not a third parallel lane).

## Approach

1. Bootstrap nested repo under `sandbox/expense-tracker/` with `SHARED_CONTRACT.md`.
2. Create worktrees `expense-tracker-lane-a` and `expense-tracker-lane-b`.
3. Implement and commit each lane independently.
4. Merge data layer first, then API layer.
5. Add pytest suite on merged `main`; run curl smoke tests.
6. Capture proof in `artifacts/merge-proof.md`.

## Deliverables

| Artifact | Description |
|----------|-------------|
| [artifacts/merge-proof.md](artifacts/merge-proof.md) | Commands, worktree names, lane outputs, merge steps, tests, conflict notes |
| [artifacts/lane-a-output.txt](artifacts/lane-a-output.txt) | Lane A verification transcript |
| [artifacts/lane-b-output.txt](artifacts/lane-b-output.txt) | Lane B verification transcript |
| [artifacts/final-test-output.txt](artifacts/final-test-output.txt) | pytest + curl proof after merge |
| [sandbox/expense-tracker/](sandbox/expense-tracker/) | Merged application (app + tests) |

## Run merged app

```bash
cd tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest tests/ -v
uvicorn app.main:app --port 8000
```

## Verification checklist

- [x] Two worktrees created with documented commands
- [x] Independent commits on `feat/a2-data-layer` and `feat/a2-api-endpoints`
- [x] Merge order: data → api
- [x] 5 pytest tests pass on merged code
- [x] curl smoke tests return valid JSON
- [x] Conflict notes documented (no manual conflict required)
- [x] merge-proof.md contains all six required sections

## Reviewer UI (live demo)

```bash
cd frontend && npm run dev
```

Open http://localhost:5173 → task **A2** → **Live demo**:

- View merge proof, lane A/B outputs, and saved test transcript
- **Run merged sandbox tests** — live `pytest` on `sandbox/expense-tracker/`
- **Run curl smoke** — POST/GET `/transactions` and GET `/balance` via port 8775
- **POST a transaction** interactively through the merged API proxy

The demo runs against this eval repo only (`tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker/`).
