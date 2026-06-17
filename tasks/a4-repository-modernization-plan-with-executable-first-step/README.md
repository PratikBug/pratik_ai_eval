# A4 — Repository Modernization Plan with Executable First Step

**Time box:** 90 minutes  
**Status:** Done

## Goal

Analyze a legacy-style repo for modernization opportunities, prioritize them, and implement the single highest-value lowest-risk first step with tests and verification proof.

## Target repo

`legacy-sandbox/` — a small monolithic Flask inventory API embedded in this task directory (standalone; no dependency on A1/A2/A3 expense-tracker).

## Deliverables

| Artifact | Description |
|----------|-------------|
| [artifacts/modernization-plan.md](artifacts/modernization-plan.md) | Executive summary, findings table, prioritized backlog, first-step rationale, rollback notes |
| [artifacts/verification-output.txt](artifacts/verification-output.txt) | pytest output from `scripts/verify.sh` |
| [artifacts/first-step-diff/summary.txt](artifacts/first-step-diff/summary.txt) | Concise change list for step 1 |
| [legacy-sandbox/](legacy-sandbox/) | Target app with first step applied |

## First step implemented

**Add pytest baseline + GET `/health` endpoint**

- `GET /health` → `{"status":"ok","service":"inventory-api"}`
- `tests/test_health.py` — 2 passing tests
- Pinned `Flask==3.0.3`, `Werkzeug==3.0.6` in `requirements.txt`
- `requirements-dev.txt` with pytest + pytest-flask

## Verification

```bash
cd tasks/a4-repository-modernization-plan-with-executable-first-step
bash scripts/verify.sh
```

## Reviewer live demo

With `npm run dev` in `frontend/`:

- Open task **A4** in the reviewer UI
- **A4ModernizationDemo** loads the plan, probes sandbox `/health`, and re-runs pytest via `POST /api/a4/verify`

## Rollback

See [artifacts/modernization-plan.md](artifacts/modernization-plan.md#rollback-notes) — remove `tests/`, revert `/health` route, restore unpinned deps.
