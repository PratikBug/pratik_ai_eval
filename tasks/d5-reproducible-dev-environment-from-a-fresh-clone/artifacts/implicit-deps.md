# Previously Implicit Dependencies

This document records what was undocumented or scattered before D5 added `.mise.toml` and `make bootstrap`.

## Before D5

| Dependency | How it was handled | Problem |
|------------|-------------------|---------|
| **Node.js** | REVIEWER.md said "Node 18+" | No pinned version; CI uses Node 20 |
| **Python** | REVIEWER.md said "Python 3.11+" | No install path; scripts hardcode `python3.11` |
| **Frontend deps** | `cd frontend && npm install` | Not lockfile-driven; differs from CI's `npm ci` |
| **D2 API venv** | Created ad hoc by D3 `run-local-ci.sh` | No standard location or one-command setup |
| **ruff** | Version `0.8.4` only in `.github/workflows/ci.yml` | Not pinned locally |
| **pytest / vitest** | Assumed after manual setup | No single entry point |

## After D5

| Dependency | How it is handled |
|------------|-------------------|
| **Node 20** | Pinned in [`.mise.toml`](../../.mise.toml) |
| **Python 3.11** | Pinned in [`.mise.toml`](../../.mise.toml) |
| **Frontend deps** | `npm ci --ignore-scripts` via `make bootstrap` |
| **D2 API venv** | Created at `tasks/d2-.../api/.venv` during bootstrap |
| **ruff 0.8.4** | Installed into D2 API venv during bootstrap |
| **Single command** | `make bootstrap` from repo root |
| **mise trust** | Auto-run on first bootstrap (`MISE_YES=1 mise trust`) |

## Still optional (not part of bootstrap)

These are required for specific task demos but **not** for the core bootstrap test suite:

| Tool | Used by |
|------|---------|
| **Docker / Colima** | D2 compose E2E, I5, D3 Docker build, D4 kind |
| **Terraform ≥ 1.5** | D1 LocalStack plan/validate |
| **Rust (cargo)** | A3 polyglot engine, B6 CLI |
| **kubectl + kind** | D4 Kubernetes manifests |
| **Python 3.12** | D3 CI matrix second leg (bootstrap uses 3.11 only) |

## Environment variables

| Variable | Default | Notes |
|----------|---------|-------|
| `NODE_ENV` | `development` | Set during vitest run |
| `PYTHONDONTWRITEBYTECODE` | `1` | Set via `.mise.toml` |
| `DATABASE_URL` | — | Only needed for D2 compose/K8s runtime, not unit tests |

## Fresh clone workflow

```bash
git clone git@bitbucket.org:paytmmoney/pratik_ai_eval.git
cd pratik_ai_eval
brew install mise   # one-time on macOS
eval "$(mise activate bash)"
make bootstrap      # install + test
```
