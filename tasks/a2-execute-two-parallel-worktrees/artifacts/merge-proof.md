# A2 — Merge Proof: Two Parallel Worktrees

**Feature:** Expense Tracker REST API (FastAPI + SQLite)  
**Sandbox:** `tasks/a2-execute-two-parallel-worktrees/sandbox/`  
**Time box:** 90 minutes

---

## 1. Commands used to create worktrees

```bash
# Bootstrap main repo
mkdir -p tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker
cd tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker
git init
git commit --allow-empty -m "chore: initial empty commit"
# add SHARED_CONTRACT.md (see sandbox/expense-tracker/SHARED_CONTRACT.md)
git add SHARED_CONTRACT.md
git commit -m "chore: add shared contract"

# Create branches and worktrees
git branch feat/a2-data-layer
git branch feat/a2-api-endpoints
git worktree add ../expense-tracker-lane-a feat/a2-data-layer
git worktree add ../expense-tracker-lane-b feat/a2-api-endpoints
git worktree list
```

### `git worktree list` (after both lanes committed)

```
.../sandbox/expense-tracker         dc51d97 [main]
.../sandbox/expense-tracker-lane-a  9777321 [feat/a2-data-layer]
.../sandbox/expense-tracker-lane-b  42b52df [feat/a2-api-endpoints]
```

---

## 2. Branch or worktree names

| Lane | Branch | Worktree path | Owns |
|------|--------|---------------|------|
| **A — Data** | `feat/a2-data-layer` | `sandbox/expense-tracker-lane-a/` | `app/models.py`, `app/database.py`, `app/config.py`, `app/__init__.py` |
| **B — API** | `feat/a2-api-endpoints` | `sandbox/expense-tracker-lane-b/` | `app/main.py`, `app/schemas.py`, `app/routes/*`, `requirements.txt`, `app/__init__.py` |
| **Main** | `main` | `sandbox/expense-tracker/` | merge target + post-merge `tests/` |

---

## 3. Separate outputs from each lane

### Lane A — [lane-a-output.txt](./lane-a-output.txt)

```
OK: transactions
9777321 feat(a2-data): add models and database setup
git diff main --name-only:
  app/__init__.py, app/config.py, app/database.py, app/models.py
```

### Lane B — [lane-b-output.txt](./lane-b-output.txt)

```
py_compile: OK
42b52df feat(a2-api): add fastapi routes and schemas
git diff main --name-only:
  app/__init__.py, app/main.py, app/routes/*, app/schemas.py, requirements.txt
```

Note: Lane B used syntax-only verification (`py_compile`) because `app.models` does not exist until Lane A is merged.

---

## 4. Final merge or reconcile steps

From `sandbox/expense-tracker/` on `main`:

```bash
git merge feat/a2-data-layer --no-ff -m "merge(a2): data layer"
git merge feat/a2-api-endpoints --no-ff -m "merge(a2): api layer"
```

### `git log --oneline --graph` after merges

```
*   dc51d97 merge(a2): api layer
|\  
| * 42b52df feat(a2-api): add fastapi routes and schemas
* |   f6f46bc merge(a2): data layer
|\ \  
| |/  
|/|   
| * 9777321 feat(a2-data): add models and database setup
|/  
* 5afb5e0 chore: add shared contract
* 0c3d6bc chore: initial empty commit
```

Post-merge on main (not a parallel lane):

- Added `tests/conftest.py`, `tests/test_transactions.py`, `tests/test_balance.py`
- Removed nested `.git` and worktrees; merged source committed to eval repo under `sandbox/expense-tracker/`

Cleanup:

```bash
git worktree remove ../expense-tracker-lane-a
git worktree remove ../expense-tracker-lane-b
rm -rf .git
```

---

## 5. Test result

See [final-test-output.txt](./final-test-output.txt).

Summary:

- **pytest:** 5 passed in 0.06s
- **Conflict marker grep:** Clean
- **curl POST /transactions:** `201` — `{"id":1,"amount":42.5,...}`
- **curl GET /transactions:** `200` — `[{...}]`
- **curl GET /balance:** `200` — `{"balance":42.5}`

Run locally:

```bash
cd tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest tests/ -v
uvicorn app.main:app --port 8000
```

---

## 6. Conflict notes

| Item | Result |
|------|--------|
| **Expected risk** | Both lanes create `app/__init__.py` (empty) |
| **Actual merge** | **No conflict** — Git auto-merged identical empty files |
| **Merge order** | Data layer first, API layer second (routes import models) |
| **Post-merge grep** | `grep -r "<<<<<<" . --include="*.py"` → Clean |
| **If conflict had occurred** | Keep either empty `app/__init__.py`; re-run pytest |

No manual conflict resolution was required. Disjoint directory ownership (data vs routes) kept merges clean aside from the shared empty init file.
