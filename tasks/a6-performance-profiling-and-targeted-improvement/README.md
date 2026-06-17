# A6 — Performance Profiling and Targeted Improvement

**Time box:** 90 minutes  
**Status:** Done

## Goal

Find a real performance bottleneck in a small service, profile it, apply one minimal targeted fix, and prove measurable improvement with before/after numbers while keeping behavior unchanged.

## Deliverables

| Artifact | Description |
|----------|-------------|
| `profile-target/` | Standalone Python catalog store with intentional N+1 SQLite queries |
| `scripts/benchmark.sh` | Reproducible baseline, after, profile, and pytest run |
| `artifacts/performance-report.md` | Full report with methodology, findings, and comparison table |
| `artifacts/baseline-output.txt` | Raw baseline + cProfile output |
| `artifacts/after-output.txt` | Raw after metrics, comparison, and test output |

## Quick start

```bash
# Full benchmark + tests (writes artifacts)
bash tasks/a6-performance-profiling-and-targeted-improvement/scripts/benchmark.sh

# Behavior tests only
cd tasks/a6-performance-profiling-and-targeted-improvement/profile-target
python3 -m pytest -q
```

## Result summary

- **Bottleneck:** N+1 queries in `store.py:58` (`fetch_summaries_n_plus_one`)
- **Fix:** Single batched JOIN in `fetch_summaries_batched`
- **Improvement:** ~65% faster (5.38 ms → 1.89 ms mean, 2,000 products, 5 iterations)
- **Tests:** 4/4 passing — identical output from both paths

## Live demo

Open the eval frontend task page for A6 — `A6PerformanceDemo` loads the performance report, runs baseline/after benchmarks via `POST /api/a6/run-benchmark`, and runs behavior tests via `POST /api/a6/run-tests`.
