# Coding Agent Evaluation Repository

Self-evaluation workspace for demonstrating coding-agent capabilities across repo discovery, greenfield builds, intermediate operations, advanced parallel work, and DevOps tasks.

Source document: [docs/What-can-you-do-using-a-coding-agent.pdf](docs/What-can-you-do-using-a-coding-agent.pdf)

## Repository layout

```
pratik_ai_eval/
├── docs/                          # Source PDF and reference material
├── frontend/                      # Reviewer web app (task list + UI demos)
├── tasks/                         # One folder per eval task
│   ├── b1-repo-artifact-inventory/
│   ├── b2-api-endpoint-map/
│   └── ...
└── README.md
```

Each task folder follows this structure:

```
tasks/<task-id>-<slug>/
├── README.md          # Goal, time box, deliverables, run instructions
├── artifacts/         # Generated outputs (reports, diagrams, proofs)
└── src/               # Task-specific code (when applicable)
```

## Task index

| ID | Category | Task | Status |
|----|----------|------|--------|
| B1 | Basics | Repo artifact inventory | Done |
| B2 | Basics | API endpoint map | Done |
| B3 | Basics | Test discovery and execution | Done |
| B4 | Basics | FastAPI greenfield service | Done |
| B5 | Basics | Node.js greenfield API or CLI | Done |
| B6 | Basics | Rust greenfield | Done |
| I1 | Intermediate | ER diagram from repo | Done |
| I2 | Intermediate | End-to-end flow trace | Done |
| I3 | Intermediate | Small safe change in unfamiliar repo | Done |
| I4 | Intermediate | Polyglot service pair (FastAPI + Node) | Done |
| I5 | Intermediate | Dockerize and run | Done |
| I6 | Intermediate | Bug diagnosis with agent | Done |
| A1 | Advanced | Multi-worktree parallel plan | Done |
| A2 | Advanced | Execute two parallel worktrees | Pending |
| A3 | Advanced | Polyglot mini-system | Pending |
| A4 | Advanced | Repository modernization plan | Pending |
| A5 | Advanced | Agent code review | Pending |
| A6 | Advanced | Performance profiling | Pending |
| D1 | DevOps | Terraform plan for a small service | Pending |
| D2 | DevOps | docker-compose stack with E2E tests | Pending |
| D3 | DevOps | CI pipeline (lint, test, build image) | Pending |
| D4 | DevOps | Kubernetes manifests on local cluster | Pending |
| D5 | DevOps | Reproducible dev environment | Pending |
| D6 | DevOps | Observability bolt-on | Pending |

## Reviewer web app

The frontend lists all tasks with status, category, time box, and links to each task README and artifacts.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 to browse tasks and verify deliverables.

For **B1**, open task **B1** in the UI, click **Use example URL** (public `ramram43210/java_spring_2019`), and run the live inventory scan in front of the reviewer.

## Working branch

Active development happens on the `stage` branch (created from `main`).

## Current focus: B2 — API endpoint map

**Goal:** In 30 minutes, identify every externally exposed API route or frontend route — from a local path or a **Bitbucket URL**.

```bash
cd tasks/b2-api-endpoint-map
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Local scan (this eval repo)
python src/scan_endpoints.py --root ../..
```

See [tasks/b2-api-endpoint-map/README.md](tasks/b2-api-endpoint-map/README.md) for full details.

## B1 — Repo artifact inventory

**Goal:** In 30 minutes, find major classes, interfaces, services, controllers, models, repositories, jobs, consumers, configs, and utilities — from a local path or a **Bitbucket URL**.

```bash
cd tasks/b1-repo-artifact-inventory
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Local scan (this eval repo)
python src/inventory_scanner.py --root ../.. --output artifacts/inventory.json
python src/render_report.py artifacts/inventory.json artifacts/inventory-report.md

# Bitbucket repo by URL (one command)
python src/scan_repo.py --repo-url https://bitbucket.org/your-workspace/your-repo
```

See [tasks/b1-repo-artifact-inventory/README.md](tasks/b1-repo-artifact-inventory/README.md) for full details.
