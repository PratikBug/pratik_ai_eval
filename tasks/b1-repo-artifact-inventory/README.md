# B1 — Repo Artifact Inventory

**Time box:** 30 minutes  
**Status:** Done

## Goal

Find major classes, interfaces, services, controllers, models, repositories, jobs, consumers, configs, and utilities in a target repository — locally or from **Bitbucket** via URL.

## Approach

1. Walk the repository tree (or shallow-clone from Bitbucket first), skipping common vendor/build directories.
2. Classify symbols and files using naming conventions and language-specific patterns (Python AST, regex for Java/TS/Go/Rust).
3. Emit structured JSON and a human-readable Markdown report with file paths and line numbers.

## Deliverables

| Artifact | Description |
|----------|-------------|
| `src/inventory_scanner.py` | Multi-language repo scanner (local path or remote URL) |
| `src/repo_source.py` | Bitbucket URL parsing and `git clone` helper |
| `src/scan_repo.py` | One-command scan + report generator |
| `src/render_report.py` | JSON → Markdown report renderer |
| `artifacts/inventory.json` | Machine-readable inventory (this eval repo) |
| `artifacts/inventory-report.md` | Reviewer-friendly report |

## Run

```bash
cd tasks/b1-repo-artifact-inventory
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Scan this eval repo (local)

```bash
python src/inventory_scanner.py --root ../.. --output artifacts/inventory.json
python src/render_report.py artifacts/inventory.json artifacts/inventory-report.md
```

### Scan any Bitbucket repo by URL

Supported URL shapes:

- Web: `https://bitbucket.org/workspace/repo`
- Web with branch: `https://bitbucket.org/ramram43210/java_spring_2019/src/master/` (public demo)
- Git HTTPS: `https://bitbucket.org/workspace/repo.git`
- Git SSH: `git@bitbucket.org:workspace/repo.git`

**Verified public repos (no login required):**

| Repo | URL | Artifacts |
|------|-----|-----------|
| Java Spring tutorials | `https://bitbucket.org/ramram43210/java_spring_2019/src/master/` | ~1,700 files; services, controllers, models, repositories |
| Spring OAuth2 example | `https://bitbucket.org/hascode/spring-oauth2-example.git` | Small Spring multi-module repo |

Private company repos (e.g. `paytmmoney/pml-equity-hybrid`) require Bitbucket git credentials on the machine running the scan.

**Reviewer UI (recommended for demos):**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 → **B1** → paste a Bitbucket URL (or click **Use example URL**) → **Run inventory scan**.

**One command** (writes `artifacts/<workspace>-<repo>-inventory.json` and report):

```bash
python src/scan_repo.py \
  --repo-url https://bitbucket.org/your-workspace/your-repo
```

**With branch override:**

```bash
python src/scan_repo.py \
  --repo-url https://bitbucket.org/your-workspace/your-repo \
  --branch develop
```

**Lower-level scanner only:**

```bash
python src/inventory_scanner.py \
  --repo-url https://bitbucket.org/your-workspace/your-repo \
  --output artifacts/my-repo-inventory.json
python src/render_report.py artifacts/my-repo-inventory.json artifacts/my-repo-report.md
```

Private Bitbucket repos require git credentials on your machine (SSH key or HTTPS app password). The clone is shallow by default (`--depth 1`); pass `--full-clone` for a full history clone.

### Scan any other local repo

```bash
python src/scan_repo.py --root /path/to/target/repo
```

## Verification checklist

- [x] Scanner identifies classes, interfaces, services, controllers, models, repositories
- [x] Scanner identifies jobs, consumers, configs, utilities
- [x] Output includes source file path and line number for each item
- [x] Report generated for this repository as proof
- [x] Remote Bitbucket URL scanning via `git clone`

## Manual verification notes

The scanner uses heuristics (naming + AST). Items marked `inferred: true` in JSON were classified by filename or pattern rather than explicit declaration. Reviewers should spot-check high-value entries against source files.
