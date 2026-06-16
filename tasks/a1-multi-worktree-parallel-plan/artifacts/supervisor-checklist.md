# A1 Supervisor Checklist — Expense Tracker (45 min)

Full plan: [parallel-plan.md](./parallel-plan.md) · Proof: [run-proof.txt](./run-proof.txt)

## Phase 0 — Repo setup (0–10 min)

```bash
mkdir expense-tracker && cd expense-tracker
git init && git commit --allow-empty -m "chore: initial empty commit"
# Add SHARED_CONTRACT.md and PARALLEL_PLAN.md (see plan)
git add SHARED_CONTRACT.md && git commit -m "chore: add shared contract"
git add PARALLEL_PLAN.md && git commit -m "docs: add A1 parallel plan"
```

- [ ] `SHARED_CONTRACT.md` committed before any lane starts
- [ ] `PARALLEL_PLAN.md` lists all 7 A1 sections

## Phase 1 — Create worktrees (10–12 min)

```bash
git branch feat/data-layer
git branch feat/api-endpoints
git branch feat/tests
git worktree add ../expense-tracker-data feat/data-layer
git worktree add ../expense-tracker-api feat/api-endpoints
git worktree add ../expense-tracker-tests feat/tests
git worktree list
```

- [ ] Four entries: main + 3 lane worktrees
- [ ] Each worktree on correct branch

## Phase 2 — Parallel lanes (12–35 min)

| Directory | Prompt section | Gate |
|-----------|----------------|------|
| `../expense-tracker-data` | Lane 1 — Data Layer | Files only in `app/models.py`, `database.py`, `config.py` |
| `../expense-tracker-api` | Lane 2 — API Endpoints | Files only in `app/routes/`, `main.py`, `schemas.py`, `requirements.txt` |
| `../expense-tracker-tests` | Lane 3 — Test Suite | Files only in `tests/` |

Per-lane checks:

- [ ] Diff respects directory ownership
- [ ] Commit message matches plan (`feat(data):`, `feat(api):`, `feat(tests):`)
- [ ] No edits outside owned paths

## Phase 3 — Merge in order (35–42 min)

From `expense-tracker` on `main`:

```bash
git merge feat/data-layer --no-ff -m "merge: data layer"
git merge feat/api-endpoints --no-ff -m "merge: api endpoints"
git merge feat/tests --no-ff -m "merge: test suite"
```

- [ ] Merge order: data → api → tests
- [ ] Resolve `app/__init__.py` trivial conflict if needed (both empty)
- [ ] `git log --oneline --graph` shows 3 feature commits + 3 merge commits

## Phase 4 — Verification (42–45 min)

```bash
pip install -r requirements.txt
pytest tests/ -v
uvicorn app.main:app --port 8000
# curl POST /transactions, GET /transactions, GET /balance
grep -r "<<<<<<" . --include="*.py" || echo "Clean"
```

- [ ] 5+ tests pass
- [ ] All 3 curl commands return valid JSON
- [ ] No conflict markers

## If something goes wrong

| Symptom | Action |
|---------|--------|
| Model field mismatch | Re-read `SHARED_CONTRACT.md`; fix in data lane only |
| Import errors after merge | Ensure merge order was data → api → tests |
| requirements.txt conflict | Keep Lane 2 version |
| Tests fail on merge | Check `conftest.py` overrides `get_db` correctly |

## Cleanup (optional)

```bash
git worktree remove ../expense-tracker-data
git worktree remove ../expense-tracker-api
git worktree remove ../expense-tracker-tests
```
