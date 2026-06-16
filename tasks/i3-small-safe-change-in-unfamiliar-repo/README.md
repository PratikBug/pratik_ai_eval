# I3 — Small Safe Change in Unfamiliar Repo

**Time box:** 60 minutes  
**Status:** Done

## Goal

Make a minimal focused change with test update, risk assessment, and agent vs manual verification notes.

## Target module (unfamiliar)

**`tasks/b6-rust-greenfield`** — Rust `log-counter` crate. Treated as unfamiliar: explored via read-only review of `lib.rs`, `main.rs`, and tests before editing.

## Change

**Case-insensitive log level matching** — lines with `info`, `Warn`, or `error` tokens now count correctly (previously required exact `INFO`/`WARN`/`ERROR`).

**Branch:** `i3/case-insensitive-log-levels` (logical branch on `stage`)

## Deliverables

| Artifact | Description |
|----------|-------------|
| [`artifacts/change-summary.md`](artifacts/change-summary.md) | Diff, files changed, why, test command/result, agent vs manual |
| [`artifacts/risk-assessment.md`](artifacts/risk-assessment.md) | Blast radius, rollback, production notes |
| [`artifacts/change.patch`](artifacts/change.patch) | Unified diff for `lib.rs` |
| [`artifacts/test-output.txt`](artifacts/test-output.txt) | `cargo test` proof (7 passed) |

## Files changed

| File | Why |
|------|-----|
| `tasks/b6-rust-greenfield/src/lib.rs` | Single-line fix in `line_contains_level`; new unit test |

## Test command

```bash
cd tasks/b6-rust-greenfield
cargo test
```

**Result:** 7 passed, 0 failed (5 unit + 2 integration).

## View in UI

```bash
cd frontend && npm run dev
```

Open task **I3** — review change summary, risk assessment, patch, and re-run B6 tests live.

## Reproduce the change

```bash
git apply tasks/i3-small-safe-change-in-unfamiliar-repo/artifacts/change.patch
cd tasks/b6-rust-greenfield && cargo test
```

For a **real unfamiliar repo**, clone an external project (e.g. B1 demo `java_spring_2019`), scope a one-file fix, and reuse this artifact template.
