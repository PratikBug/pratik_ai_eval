# A5 — Agent Code Review and Adversarial Verification

**Time box:** 60 minutes  
**Status:** Done

## Goal

Review an agent-generated PR for correctness, security, tests, performance, and maintainability. Deliver a structured, evidence-based review report with adversarial verification.

## PR under review

| Path | Role |
|------|------|
| `review-base/` | Pre-PR baseline (minimal notes API) |
| `review-target/` | Agent PR head — **review subject** |
| `artifacts/agent-pr.patch` | Unified diff base → target |

**Agent PR intent:** Add API-key auth, search, pagination, admin export, and pytest coverage to a Flask notes micro-API.

## Deliverables

| Artifact | Description |
|----------|-------------|
| `artifacts/code-review-report.md` | Full review — 14 issues, 7 blocking, verdict **Request changes** |
| `artifacts/verification-output.txt` | Output of `scripts/verify.sh` (pytest + adversarial probes) |
| `suggested-fixes/` | Demonstration fixes for SQL injection + pagination (+ tests) |
| `A5CodeReviewDemo` | Reviewer UI — report, PR summary, run verification |

## Issue summary

- **14 issues** across security (4), correctness (4), tests (2), performance (2), maintainability (2)
- **7 blocking:** hardcoded secret, SQL injection, open CORS, admin bypass, POST validation, wrong 404, pagination off-by-one
- **Verdict:** Request changes

## Verification

```bash
cd tasks/a5-agent-code-review-and-adversarial-verification
bash scripts/verify.sh

cd ../../frontend && npm test
```

## Live demo

Start the reviewer app (`cd frontend && npm run dev`), open task **A5**, use **A5CodeReviewDemo** to load the report, view PR file list, see issue counts, and re-run verification.
