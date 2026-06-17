# D5 — Reproducible Dev Environment from a Fresh Clone

**Time box:** 45 minutes  
**Status:** Done

## Goal

Single-command bootstrap from a fresh clone so lint and tests pass on a clean machine — without manually installing Node, Python, or hunting for versions.

## Single command

From repo root:

```bash
make bootstrap
```

Requires [mise](https://mise.jdx.dev/) (`brew install mise`). Pins **Node 20** and **Python 3.11** via [`.mise.toml`](../../.mise.toml), simulates a fresh clone (removes `node_modules` and D2 API `.venv`), installs deps, and runs:

1. ruff lint (D2 api/worker)
2. D2 API pytest
3. frontend vitest (~147 tests)

## Bootstrap config files

| File | Purpose |
|------|---------|
| [`Makefile`](../../Makefile) | `bootstrap`, `test`, `lint`, `clean` targets |
| [`.mise.toml`](../../.mise.toml) | Pin Node 20 + Python 3.11 |
| `scripts/bootstrap.sh` | Install + test logic |
| `scripts/test.sh` | Lint + test only (after bootstrap) |

## Other commands

```bash
make test    # lint + pytest + vitest (deps must exist)
make lint    # ruff only
make clean   # remove node_modules and D2 API .venv

# Reviewer artifact capture
bash tasks/d5-reproducible-dev-environment-from-a-fresh-clone/scripts/verify.sh
```

## Deliverables

### Bootstrap config files

- Repo root: `Makefile`, `.mise.toml`
- Task scripts: `scripts/bootstrap.sh`, `scripts/test.sh`, `scripts/verify.sh`

### Single command output

`artifacts/bootstrap-log.txt` — full `make bootstrap` terminal output.

### Passing test run

`artifacts/test-output.txt` — extracted test/lint section showing green suite.

### Previously implicit deps

`artifacts/implicit-deps.md` — versions, env vars, and optional tools documented.

## Prerequisites

| Tool | Install |
|------|---------|
| **mise** | `brew install mise` |
| **make** | Preinstalled on macOS / Linux |

Docker, Rust, Terraform, and kubectl are **not** required for bootstrap — see `implicit-deps.md`.

## Reviewer UI

Open task **D5** in the reviewer UI (`npm run dev`) and click **Re-run bootstrap** to execute `verify.sh` and refresh artifacts.

## Fresh clone proof

```bash
git clone <repo-url> pratik_ai_eval
cd pratik_ai_eval
eval "$(mise activate bash)"
make bootstrap
```

Expected: exit 0, all tests pass, deps installed under `frontend/node_modules` and `tasks/d2-.../api/.venv`.
