# A6 — Performance Profiling Report

## Executive summary

**Bottleneck:** N+1 SQLite queries in `fetch_summaries_n_plus_one` — one `SELECT` per product after an initial ID lookup (2,001 round-trips for 2,000 products).

**Fix:** Replace the per-row loop with a single batched `JOIN` query in `fetch_summaries_batched`.

**Result:** **64.9% faster** on the hot path (5.38 ms → 1.89 ms mean over 5 iterations). Behavior unchanged — 4/4 pytest assertions pass with identical payloads from both paths.

---

## Environment

| Item | Value |
|------|-------|
| OS | macOS (darwin 25.5.0) |
| Python | 3.9+ (system `python3`) |
| Database | SQLite in-memory (`:memory:`) |
| Product count | 2,000 seeded rows |
| Hardware | Apple Silicon (local dev machine) |

---

## Baseline methodology + numbers

**Method:** `python3 benchmark.py --mode baseline` — seeds an in-memory SQLite catalog, runs `fetch_summaries_n_plus_one` **5 times**, reports mean wall-clock time via `time.perf_counter()`.

**Command:**
```bash
cd tasks/a6-performance-profiling-and-targeted-improvement/profile-target
python3 benchmark.py --mode baseline
```

**Baseline numbers (captured in `artifacts/baseline-output.txt`):**

| Metric | Value |
|--------|-------|
| Mean latency | **5.47 ms** |
| Products | 2,000 |
| Iterations | 5 |
| Queries per run | 2,001 (1 ID scan + 2,000 individual lookups) |

---

## Profiling method + findings

**Method:** `python3 benchmark.py --mode profile` — `cProfile` on a single N+1 fetch, sorted by cumulative time.

**Top hotspots:**

| Rank | Location | Finding |
|------|----------|---------|
| 1 | `store.py:58` `fetch_summaries_n_plus_one` | Entire hot path; 99%+ cumulative time |
| 2 | `{method 'execute'}` × **2,001** | One `conn.execute()` per product |
| 3 | `store.py:48` `_row_to_summary` × 2,000 | Row mapping (negligible vs queries) |

Profile excerpt:
```
ncalls  cumtime  filename:lineno(function)
    1    0.006   store.py:58(fetch_summaries_n_plus_one)
 2001    0.003   {method 'execute' of 'sqlite3.Connection' objects}
```

---

## Bottleneck explanation

The catalog summary endpoint loads all product IDs, then loops with a parameterized `SELECT … WHERE p.id = ?` for each ID. With 2,000 products this executes **2,001 separate SQL statements** per request. SQLite processes each round-trip independently — no query planner batching — so latency scales linearly with catalog size. This is a realistic anti-pattern seen when ORMs lazy-load relations inside a loop.

---

## Change description

**Single focused change** in `profile-target/store.py`:

- **Before:** `fetch_summaries_n_plus_one` — loop + per-ID query (kept for baseline comparison only).
- **After:** `fetch_summaries_batched` — one `JOIN` between `products` and `categories`, `ORDER BY p.id`.

No schema changes, no unrelated refactors. Production code path uses the batched function; N+1 variant retained so `benchmark.py` can reproduce before/after on the same dataset.

---

## After numbers + comparison

**Method:** Same as baseline — `python3 benchmark.py --mode both`, 5 iterations, same seed data.

| Metric | Baseline (N+1) | After (batched) | Delta |
|--------|----------------|-----------------|-------|
| Mean latency | 5.38 ms | 1.89 ms | **−3.49 ms** |
| SQL executes | 2,001 | 1 | **−99.95%** |
| Improvement | — | — | **64.9%** |

Raw output: `artifacts/after-output.txt`, `artifacts/baseline-output.txt`.

---

## Behavior verification

**Command:**
```bash
cd tasks/a6-performance-profiling-and-targeted-improvement/profile-target
python3 -m pytest -q
```

**Result:** **4 passed** — both paths return identical payloads, correct shape, sorted IDs.

Reproducible full run:
```bash
bash tasks/a6-performance-profiling-and-targeted-improvement/scripts/benchmark.sh
```

---

## Rollback notes

To revert the optimization, point callers at `fetch_summaries_n_plus_one` instead of `fetch_summaries_batched`. No migrations or config changes required. Benchmark script will continue to report baseline numbers from the N+1 function.
