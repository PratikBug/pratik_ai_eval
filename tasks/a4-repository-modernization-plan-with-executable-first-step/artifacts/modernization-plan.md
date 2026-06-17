# A4 Modernization Plan — Legacy Inventory Sandbox

## Executive summary

The target is `legacy-sandbox/`, a small monolithic Flask inventory API embedded in the A4 task directory. It exhibits typical legacy debt: hardcoded secrets, unpinned dependencies, no automated tests, no health probe, and always-on debug mode. The highest-value, lowest-risk first step is **establishing a pytest baseline and adding a `/health` endpoint** — this unlocks CI, load-balancer readiness checks, and safe follow-on refactors without changing business logic.

---

## Findings

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| F1 | Hardcoded `SECRET_KEY` | High | `legacy-sandbox/app.py:6` — `app.config["SECRET_KEY"] = "dev-secret-do-not-use-in-prod"` |
| F2 | Debug mode always enabled | High | `legacy-sandbox/app.py:7` — `DEBUG = True`; passed to `app.run(..., debug=DEBUG)` at line 42 |
| F3 | Unpinned runtime dependencies | Medium | Pre-step `requirements.txt` contained bare `Flask` and `Werkzeug` with no version pins |
| F4 | No automated test suite | High | Pre-step: no `tests/` directory, no pytest in dependencies |
| F5 | No health/readiness endpoint | Medium | Pre-step: no `/health` route; only `/`, `/api/items`, `/api/items/<id>` |
| F6 | Monolithic single-file layout | Low | All routes and state in `legacy-sandbox/app.py` (44 lines) |
| F7 | No lint/format tooling | Low | No `ruff.toml`, `.flake8`, or pre-commit config in sandbox |
| F8 | In-memory global mutable state | Medium | `legacy-sandbox/app.py:9` — module-level `ITEMS` list shared across requests |
| F9 | No environment-based configuration | Medium | Host, port, debug, and secret all hardcoded in source |

---

## Prioritized backlog

Ranked by **value ÷ (risk × effort)**. Lower effort and risk items that unblock later work rank first.

| Rank | Item | Value | Risk | Effort | Depends on |
|------|------|-------|------|--------|------------|
| 1 | **Add pytest + `/health` endpoint** | High — CI gate, K8s probes | Low — additive | S | — |
| 2 | Pin runtime dependencies | Medium — reproducible builds | Low | S | — |
| 3 | Move `SECRET_KEY` to env var | High — security | Low | S | #1 (tests) |
| 4 | Add ruff lint config | Medium — code quality | Low | S | #1 |
| 5 | Disable debug via env (`FLASK_DEBUG`) | High — prod safety | Low | S | #3 |
| 6 | Extract config module | Medium — maintainability | Medium | M | #3, #5 |
| 7 | Split routes into blueprints | Medium — structure | Medium | M | #1, #6 |
| 8 | Replace in-memory store with SQLite | Medium — persistence | High | L | #7 |
| 9 | Add Docker + compose | Medium — deployability | Medium | M | #1, #2, #5 |
| 10 | Migrate Flask → FastAPI | Low immediate value | High | L | #7, #8 |

---

## Chosen first step

**Rank #1: Add pytest harness + GET `/health` with tests**

### Rationale

- **Highest value:** Creates the safety net required for every subsequent modernization item. Adds a standard readiness probe for orchestrators and load balancers.
- **Lowest risk:** Purely additive — no existing routes modified, no refactor of business logic.
- **Minimal effort:** ~6 files, runnable in under 15 minutes.
- **Verifiable:** `pytest tests/ -v` provides deterministic pass/fail proof.

Items #2 (pin deps) was partially bundled: runtime pins added to `requirements.txt` as part of making tests reproducible.

---

## Implementation summary

### Files added/changed

| File | Change |
|------|--------|
| `legacy-sandbox/app.py` | Added `GET /health` returning `{"status":"ok","service":"inventory-api"}` |
| `legacy-sandbox/requirements.txt` | Pinned `Flask==3.0.3`, `Werkzeug==3.0.6` |
| `legacy-sandbox/requirements-dev.txt` | **New** — pytest + pytest-flask |
| `legacy-sandbox/tests/conftest.py` | **New** — Flask test client fixture, clears `ITEMS` |
| `legacy-sandbox/tests/test_health.py` | **New** — 2 tests for health endpoint |
| `scripts/verify.sh` | **New** — runs pytest, captures output to artifacts |

### Diff reference

See `artifacts/first-step-diff/summary.txt` for a concise change list. Key addition in `app.py`:

```python
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "inventory-api"})
```

---

## Verification

```bash
cd tasks/a4-repository-modernization-plan-with-executable-first-step
bash scripts/verify.sh
```

Expected: pytest reports **2 passed**, exit code 0. Full output captured in `artifacts/verification-output.txt`.

Frontend reviewer demo (`A4ModernizationDemo`) loads this plan and can re-run verification via `POST /api/a4/verify`.

---

## Rollback notes

To undo the first step:

```bash
cd tasks/a4-repository-modernization-plan-with-executable-first-step/legacy-sandbox

# Remove test infrastructure
rm -rf tests/ requirements-dev.txt

# Revert app.py — delete the /health route (lines 17–19)
# Revert requirements.txt to unpinned:
#   Flask
#   Werkzeug

# Remove venv if created
rm -rf .venv
```

No database migrations or external state to revert. The in-memory `ITEMS` list is unchanged.

---

## Next recommended steps (post-A4)

1. Move `SECRET_KEY` to `os.environ.get("SECRET_KEY", ...)` with startup warning if default used.
2. Add `ruff.toml` and run in CI alongside pytest.
3. Gate `DEBUG` behind `FLASK_DEBUG` env var defaulting to `false`.
