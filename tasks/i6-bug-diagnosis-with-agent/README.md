# I6 — Bug Diagnosis with Agent

**Time box:** 60 minutes  
**Status:** Done

## Goal

Diagnose a seeded bug in an unfamiliar checkout shipping module: reproduce, root-cause, minimal fix, verify with tests.

## Seeded scenario

**Acme checkout** — `calculate_shipping(subtotal_cents)` should return **$0** shipping when subtotal is **≥ $50.00**.

**Bug:** Used `>` instead of `>=`, so **exactly $50.00** still charged **$5.99**.

## Live reviewer demo

```bash
cd frontend && npm run dev
```

Open task **I6** — reproduce buggy output, read root cause, run pytest verification.

## Reproduction

```bash
# Side-by-side buggy vs fixed at $50.00
python3 tasks/i6-bug-diagnosis-with-agent/scripts/show-buggy-behavior.py
```

## Verification (after fix)

```bash
cd tasks/i6-bug-diagnosis-with-agent/service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```

## Deliverables

| Artifact | Contents |
|----------|----------|
| [`artifacts/bug-report.md`](artifacts/bug-report.md) | Reproduction, root cause, fix, agent vs manual |
| [`artifacts/seeded-bug.patch`](artifacts/seeded-bug.patch) | One-line diff showing seeded bug |
| [`artifacts/fix-verification.txt`](artifacts/fix-verification.txt) | pytest output (4 passed) |

## Service layout

```
service/
├── src/shipping.py      # fixed implementation
└── tests/test_shipping.py
```
