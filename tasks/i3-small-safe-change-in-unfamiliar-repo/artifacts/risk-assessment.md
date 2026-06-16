# I3 — Risk assessment

**Change:** Case-insensitive log level token matching in `tasks/b6-rust-greenfield/src/lib.rs`  
**Date:** 2026-06-17

## Blast radius

| Area | Impact | Severity |
|------|--------|----------|
| `line_contains_level` | Behavior change for non-uppercase tokens | **Low** — additive for typical logs |
| `classify_line` priority | Unchanged (ERROR > WARN > INFO) | None |
| CLI output format | Unchanged | None |
| Public API surface | No signature changes | None |
| Downstream B6 demo / vite plugin | Uses same binary; no code changes | None |

## What could break

1. **New matches on mixed-case logs** — Lines previously ignored (e.g. `info boot`) now increment counts. This is intended; consumers expecting strict uppercase-only would see different numbers.
2. **Token `error` in unrelated words** — Mitigated by alphanumeric tokenization: `terror` stays one token; `error-handler` splits to `error` + `handler` and would match ERROR (same as uppercase `ERROR` in `ERROR-handler`).
3. **Performance** — `eq_ignore_ascii_case` vs `==` is negligible for line-by-line log parsing.

## Rollback plan

```bash
cd tasks/b6-rust-greenfield
git checkout HEAD~1 -- src/lib.rs   # or apply change.patch in reverse
cargo test
```

Or revert commit on `stage` if merged.

## Production considerations (if this were a real service)

- **Observability:** Document that levels are matched case-insensitively in release notes.
- **Monitoring:** No new metrics; count deltas only affect non-standard log formats.
- **Deployment:** Single binary redeploy; no migration or config flag required.

## Sign-off

| Check | Status |
|-------|--------|
| Minimal diff (1 production line) | ✅ |
| New/updated test | ✅ `counts_case_insensitive_log_levels` |
| Full test suite green | ✅ 7/7 |
| No unrelated refactors | ✅ |
| Rollback documented | ✅ |
