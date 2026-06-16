# B6 — Rust Greenfield

**Time box:** 60 minutes  
**Status:** Done

## Goal

Rust CLI that accepts a file path, counts INFO/WARN/ERROR log levels, handles missing files gracefully, with at least 3 tests.

## CLI

```bash
log-counter <path-to-log-file>
```

Output (stdout):

```
INFO: 3
WARN: 2
ERROR: 2
```

Missing files print a clear error to stderr and exit with code **1** (no panic).

### Level detection

Each line is scanned for whole-word tokens `INFO`, `WARN`, or `ERROR`. If a line contains multiple levels, **ERROR** wins over **WARN**, which wins over **INFO**.

## Cargo commands

### Build

```bash
cd tasks/b6-rust-greenfield
cargo build --release
```

Binary: `target/release/log-counter`

### Run

```bash
cargo run -- sample.log
# or after release build:
./target/release/log-counter sample.log
```

### Test

```bash
cargo test
```

Six tests total:
- 4 unit tests in `src/lib.rs` (counts, missing file, empty file, ignored lines)
- 2 integration tests in `tests/cli_integration.rs` (CLI success + missing file)

## Reviewer UI demo

With `npm run dev` in `frontend/`, open task **B6**. The live demo:

- Runs **`cargo test`** with live output
- Runs **`cargo run -- sample.log`** and shows INFO/WARN/ERROR counts
- **Demo missing file** — shows graceful stderr and exit code 1

Requires Rust toolchain on PATH. First run may compile dependencies (~20s).

## Project layout

```
tasks/b6-rust-greenfield/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── lib.rs      # counting logic + unit tests
│   └── main.rs     # clap CLI entrypoint
├── tests/
│   └── cli_integration.rs
├── sample.log      # example input
└── artifacts/
    └── run-proof.txt
```

## Example

```bash
$ cargo run -- sample.log
INFO: 3
WARN: 2
ERROR: 2

$ cargo run -- does-not-exist.log
error: file not found: does-not-exist.log
```

## Deliverables

- [`Cargo.toml`](Cargo.toml) + [`src/`](src/) — Cargo project and CLI
- [`tests/`](tests/) — integration tests
- [`artifacts/run-proof.txt`](artifacts/run-proof.txt) — `cargo test` + run proof
