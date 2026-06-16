# I6 — Bug diagnosis report

**Time box:** 60 minutes  
**Target:** `tasks/i6-bug-diagnosis-with-agent/service/` — unfamiliar Acme checkout shipping module  
**Seeded bug ID:** `I6-SHIP-001`

## Summary

Free shipping applies at **$50.00 or more**, but the seeded code used strict `>` so a cart of **exactly $50.00** incorrectly charged **$5.99** shipping.

---

## Reproduction steps

### 1. Observe buggy behavior (live)

```bash
python3 tasks/i6-bug-diagnosis-with-agent/scripts/show-buggy-behavior.py
```

**Expected output:** `Buggy shipping fee: 599 cents` for a $50.00 subtotal.

### 2. Failing test (before fix)

With the seeded operator (`>` instead of `>=`), this test fails:

```bash
cd tasks/i6-bug-diagnosis-with-agent/service
pytest -v tests/test_shipping.py::test_free_shipping_at_exactly_fifty_dollars
```

**Failure:** `assert 599 == 0` — shipping charged when it should be free.

### 3. Manual Python REPL

```python
from src.shipping import calculate_shipping  # after reverting patch to buggy `>`
calculate_shipping(5000)  # returned 599 (bug) instead of 0
```

---

## Root cause

| Item | Detail |
|------|--------|
| **File** | `tasks/i6-bug-diagnosis-with-agent/service/src/shipping.py` |
| **Function** | `calculate_shipping(subtotal_cents: int) -> int` |
| **Line** | Boundary check (~line 11) |
| **Bug** | `if subtotal_cents > FREE_SHIPPING_THRESHOLD_CENTS:` |
| **Should be** | `if subtotal_cents >= FREE_SHIPPING_THRESHOLD_CENTS:` |
| **Why** | Business rule is “$50.00 **or more**” → inclusive threshold. Strict `>` excludes exactly 5000 cents. |

See [`seeded-bug.patch`](seeded-bug.patch) for the one-line diff.

---

## Minimal fix

```diff
-    if subtotal_cents > FREE_SHIPPING_THRESHOLD_CENTS:
+    if subtotal_cents >= FREE_SHIPPING_THRESHOLD_CENTS:
         return 0
```

**Files changed:** `service/src/shipping.py` only (1 line).  
**Tests added/updated:** `test_free_shipping_at_exactly_fifty_dollars` in `service/tests/test_shipping.py`.

---

## Verification command and result

```bash
cd tasks/i6-bug-diagnosis-with-agent/service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```

**Result:** 4 passed, 0 failed — see [`fix-verification.txt`](fix-verification.txt).

```
tests/test_shipping.py::test_free_shipping_at_exactly_fifty_dollars PASSED
```

---

## Agent suggested vs manually verified

| Topic | Agent suggested | Manually verified |
|-------|-----------------|-------------------|
| Reproduction | Run `test_free_shipping_at_exactly_fifty_dollars` | Confirmed fails with `>` operator |
| Root cause | Off-by-one at threshold (`>` vs `>=`) | Read `shipping.py:11`, matched business rule in README |
| Fix scope | Change single comparison operator | Only `shipping.py` modified; no refactors |
| Edge cases | Keep `$49.99` charged, `$50.00` free | `test_charges_standard_shipping_below_threshold` + at-threshold test |
| Verification | Full `pytest -v` | 4/4 green; output saved to `fix-verification.txt` |
| Live demo | `show-buggy-behavior.py` for reviewer UI | Script prints 599 vs 0 side-by-side |

---

## Rollback (re-seed bug for training)

```bash
cd tasks/i6-bug-diagnosis-with-agent
patch -R -p0 < artifacts/seeded-bug.patch
# Re-run pytest — expect 1 failure
```
