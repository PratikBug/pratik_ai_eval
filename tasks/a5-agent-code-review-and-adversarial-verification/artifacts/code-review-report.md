# A5 — Code Review Report: Agent Notes API PR

**Reviewer:** Adversarial verification pass  
**PR target:** `review-target/` (diff from `review-base/` in `artifacts/agent-pr.patch`)  
**Verdict:** **Request changes** — 7 blocking issues must be resolved before merge  
**Date:** 2026-06-17

---

## Executive summary

An agent opened PR `#agent-notes-api` to extend a minimal Flask notes API with API-key auth, search, pagination, and admin export. Static review plus adversarial probes found **14 issues** (4 critical/high security, 3 correctness bugs with user-visible impact, 2 test gaps, 2 performance concerns, 3 maintainability items). Agent pytest suite passes (5/5) but **does not exercise real search, auth failures, pagination semantics, or error paths** — giving false confidence.

**Blocking:** hardcoded secret, SQL injection, open CORS, trivial admin bypass, missing POST validation (500 crash), wrong 404 status, pagination off-by-one.  
**Non-blocking:** N+1 queries, unbounded export, dead code, in-memory counter race, weak tests, debug bind.

Demonstration fixes for SQL injection + pagination live in `suggested-fixes/` with 2 passing tests (see `artifacts/verification-output.txt`).

---

## PR scope summary

| Area | Change |
|------|--------|
| Auth | `auth.py` — `X-API-Key` header check |
| Search | `GET /api/notes/search?q=` |
| Pagination | `GET /api/notes?page=` |
| Export | `GET /api/notes/export` (admin) |
| CORS | `flask-cors` on `/api/*` |
| Tests | 5 pytest cases in `tests/test_notes.py` |
| Files touched | +`auth.py`, +`config.py`, ~`db.py`, ~`app.py`, +tests |

Base (`review-base/`): health + CRUD list/create only. Head (`review-target/`): full agent PR under review.

---

## Issue table

| ID | Category | Severity | Blocking? | Location | Description | Suggested fix | Verification |
|----|----------|----------|-----------|----------|-------------|---------------|--------------|
| A5-001 | Security | **Critical** | **Yes** | `review-target/auth.py:6` | Hardcoded API key `INTERNAL_API_KEY = "sk-agent-a5-demo-key-do-not-ship"` committed to repo; same value in `tests/conftest.py:28`. | Load from env (`NOTES_API_KEY`); fail startup if unset in prod. Use secret manager in deployment. | `rg 'sk-agent\|INTERNAL_API_KEY' review-target` → expect 0 after fix |
| A5-002 | Security | **Critical** | **Yes** | `review-target/db.py:52` | `search_notes` builds SQL via f-string: `f"... LIKE '%{query}%'..."` — classic injection. | Parameterized query: `WHERE title LIKE ? OR body LIKE ?` with `('%'+q+'%',)` | `curl '/api/notes/search?q=%27+OR+1=1--'` with valid key → expect ≤1 row, not full leak (currently **INJECTION_LEAK**, 2 rows) |
| A5-003 | Security | **High** | **Yes** | `review-target/app.py:11` | `CORS(app, resources={r"/api/*": {"origins": "*"}})` allows any origin to call authenticated API from browser. | Restrict to configured allowlist; omit credentials if using cookies. | Inspect response headers from cross-origin preflight; origins should not be `*` |
| A5-004 | Security | **High** | **Yes** | `review-target/auth.py:17-18`, `app.py:65-67` | Admin export gated only by `X-Admin: 1` header — no shared secret, trivial to forge. | Require `NOTES_ADMIN_TOKEN` env match on header value; audit log exports. | `curl /api/notes/export` without admin header → 403; with `X-Admin:1` alone → must still 403 after fix |
| A5-005 | Correctness | **High** | **Yes** | `review-target/app.py:31-35` | POST accepts `title: null`; passes through to SQLite → **500** `IntegrityError` instead of 400. Base validated title (`review-base/app.py:19-21`). | `(data.get("title") or "").strip()` + 400 if empty before DB. | `curl -X POST ... -d '{"title":null}'` → expect 400, not 500 |
| A5-006 | Correctness | **Medium** | **Yes** | `review-target/app.py:58-59` | Missing note returns **200** with error JSON; should be **404**. Breaks REST clients and caches. | `return jsonify({"error": "not found"}), 404` | `curl /api/notes/9999` → HTTP 404 (currently 200) |
| A5-007 | Correctness | **High** | **Yes** | `review-target/db.py:60` | Pagination uses `offset = page * PAGE_SIZE` (1-indexed pages skip first page). Page 1 returns items 11–12 of 12, not 1–10. | `offset = (max(1, page) - 1) * PAGE_SIZE` | Seed 12 notes; `page=1` → 10 items, `page=2` → 2 items |
| A5-008 | Correctness | **Low** | No | `review-target/db.py:9,31-35` | Module-level `_note_counter` incremented without lock — race under concurrent workers. | Remove unused counter or use DB `COUNT(*)`. | Load test with threaded POSTs; counter not used in responses today |
| A5-009 | Tests | **Medium** | No | `review-target/tests/test_notes.py:22-25` | `test_search_notes` patches `db.search_notes` to `[]` — never tests real search or injection. | Call live endpoint; assert matching titles returned. | pytest without mock; add injection regression test |
| A5-010 | Tests | **Medium** | No | `review-target/tests/test_notes.py:40-43` | `test_export_admin` patches `require_api_key` — export path skips auth entirely in test. | Use real headers; assert 401 without key, 403 without admin token. | Remove `@patch("auth.require_api_key")` |
| A5-011 | Performance | **Medium** | No | `review-target/db.py:68-71` | `list_notes` N+1: one query per row via `_fetch_tags_for_note`. | Parse `tag` column inline (already in SELECT). | Log query count for 10-item page → should be 1 query |
| A5-012 | Performance | **Medium** | No | `review-target/db.py:83-86`, `app.py:67` | `list_all_notes_unbounded()` loads entire table — no limit on export. | Stream/chunk export or cap + pagination token. | Seed 10k rows; measure memory/latency |
| A5-013 | Maintainability | **Low** | No | `review-target/app.py:14-16` | `_unused_legacy_formatter` dead code never referenced. | Delete function. | `rg '_unused_legacy_formatter'` → 0 hits |
| A5-014 | Maintainability | **High** | No | `review-target/app.py:73` | `app.run(..., host="0.0.0.0", debug=True)` — debug Werkzeug console on all interfaces if run as script. | `debug=os.environ.get("FLASK_DEBUG")=="1"`, bind `127.0.0.1` in dev. | Grep `debug=True`; production entrypoint should use gunicorn |

---

## Severity / blocking summary

| Severity | Count | Blocking |
|----------|-------|----------|
| Critical | 2 | 2 |
| High | 5 | 4 |
| Medium | 5 | 1 |
| Low | 2 | 0 |
| **Total** | **14** | **7 blocking** |

---

## Adversarial test cases tried

| Probe | Command / method | Result |
|-------|------------------|--------|
| Secret grep | `rg 'sk-agent\|INTERNAL_API_KEY' review-target` | 3 hits — key in source + tests |
| SQL injection | `GET /api/notes/search?q=' OR 1=1--` | **INJECTION_LEAK** — returns all rows |
| Missing title | `POST {"title": null}` | HTTP **500** IntegrityError |
| Pagination | 12 notes, `page=1` vs `page=0` | page1=**2** items, page0=**10** (inverted) |
| Not found | `GET /api/notes/9999` | HTTP **200** (should 404) |
| Admin bypass | `GET /api/notes/export` + `X-Admin: 1` | 200 with full dump, no API key |
| Agent pytest | `pytest -v` in review-target | 5 passed — false green |

Full output: `artifacts/verification-output.txt` (`bash scripts/verify.sh`).

---

## Suggested fixes (implemented samples)

| Issue | Path | Proof |
|-------|------|-------|
| A5-001 | `suggested-fixes/auth.py` | Env-based `NOTES_API_KEY` |
| A5-002, A5-007 | `suggested-fixes/db_search_and_pagination.py` | Parameterized search + `(page-1)*PAGE_SIZE` |
| Tests | `suggested-fixes/test_fixes.py` | 2 passed — injection contained, page1=10 items |

---

## Overall verification checklist

- [x] Read full PR diff (`artifacts/agent-pr.patch`)
- [x] Static review with file:line evidence for ≥8 issues across 5 categories
- [x] Run agent test suite (passes but insufficient)
- [x] Adversarial probes for injection, auth, pagination, error paths
- [x] Grep for secrets and dangerous patterns
- [x] Document blocking vs non-blocking with justification
- [x] Provide runnable verification commands per issue
- [x] Capture output in `artifacts/verification-output.txt`
- [ ] **Merge blocked** until A5-001 through A5-007 resolved

**Run all checks:**

```bash
cd tasks/a5-agent-code-review-and-adversarial-verification
bash scripts/verify.sh
```

**Frontend demo:** `npm run dev` → A5 task page → A5CodeReviewDemo loads report, PR summary, runs verify.
