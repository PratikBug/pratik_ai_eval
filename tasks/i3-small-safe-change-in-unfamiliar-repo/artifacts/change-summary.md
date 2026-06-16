# I3 — Change summary

**Time box:** 60 minutes  
**Branch:** `i3/case-insensitive-log-levels` (logical branch; merged on `stage`)  
**Target repo / module:** `tasks/b6-rust-greenfield` — Rust `log-counter` crate (treated as unfamiliar; no prior edits in this I3 session)

## Change

**Problem:** Log lines with lowercase or mixed-case level tokens (`info`, `Warn`, `error`) were ignored. Only exact uppercase tokens (`INFO`, `WARN`, `ERROR`) matched.

**Fix:** Use ASCII case-insensitive token comparison in `line_contains_level`.

## Diff

See [`change.patch`](change.patch) (1 file, minimal diff).

```diff
 fn line_contains_level(line: &str, level: &str) -> bool {
     line.split(|character: char| !character.is_ascii_alphanumeric())
-        .any(|token| token == level)
+        .any(|token| token.eq_ignore_ascii_case(level))
 }
```

Plus new unit test `counts_case_insensitive_log_levels` in the same file.

## Files changed

| File | Change | Why |
|------|--------|-----|
| `tasks/b6-rust-greenfield/src/lib.rs` | 1-line fix in `line_contains_level`; 1 new `#[test]` | Only place where log level tokens are matched; test proves lowercase/mixed-case lines count correctly |

**Files intentionally not changed:** `main.rs`, `cli_integration.rs`, `Cargo.toml` — CLI and integration paths delegate to `lib.rs`; existing tests cover regression.

## Test command and result

```bash
cd tasks/b6-rust-greenfield
cargo test
```

**Result:** 7 passed (5 unit + 2 integration), 0 failed — see [`test-output.txt`](test-output.txt).

```
test tests::counts_case_insensitive_log_levels ... ok
test tests::counts_info_warn_and_error_lines ... ok
...
test cli_prints_counts_for_sample_log ... ok
test result: ok. 7 passed; 0 failed
```

## Agent suggested vs manually verified

| Topic | Agent suggested | Manually verified |
|-------|-----------------|-------------------|
| Scope | Single function, one line | Confirmed no other call sites for token matching |
| Test | Add unit test with `info`/`Warn`/`error` lines | `cargo test counts_case_insensitive_log_levels` passes |
| Regression | Existing tests sufficient | Full `cargo test` — all 7 green |
| False positives | Token split avoids substring match on `information` | Reviewed: `information` → single token, does not match `INFO` |
| Integration | No CLI change needed | `cli_prints_counts_for_sample_log` still passes (uppercase sample) |
| Rollback | Revert `lib.rs` one line + remove test | Patch applies cleanly in reverse |

## Reproduce

```bash
cd tasks/b6-rust-greenfield
cargo test
cargo run -- path/to/logfile.log   # now counts info/warn/error case-insensitively
```

Or open task **I3** in the reviewer UI and click **Run B6 tests**.
