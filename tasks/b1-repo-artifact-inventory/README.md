# B1 — Repo Artifact Inventory

**Time box:** 30 minutes  
**Status:** Done

## Goal

Find major classes, interfaces, services, controllers, models, repositories, jobs, consumers, configs, and utilities in a target repository.

## Approach

1. Walk the repository tree, skipping common vendor/build directories.
2. Classify symbols and files using naming conventions and language-specific patterns (Python AST, regex for Java/TS/Go/Rust).
3. Emit structured JSON and a human-readable Markdown report with file paths and line numbers.

## Deliverables

| Artifact | Description |
|----------|-------------|
| `src/inventory_scanner.py` | Multi-language repo scanner |
| `src/render_report.py` | JSON → Markdown report renderer |
| `artifacts/inventory.json` | Machine-readable inventory |
| `artifacts/inventory-report.md` | Reviewer-friendly report |

## Run

```bash
cd tasks/b1-repo-artifact-inventory
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Scan this eval repo (default)
python src/inventory_scanner.py --root ../.. --output artifacts/inventory.json
python src/render_report.py artifacts/inventory.json artifacts/inventory-report.md

# Scan any other repo
python src/inventory_scanner.py --root /path/to/target/repo --output artifacts/other-repo.json
```

## Verification checklist

- [x] Scanner identifies classes, interfaces, services, controllers, models, repositories
- [x] Scanner identifies jobs, consumers, configs, utilities
- [x] Output includes source file path and line number for each item
- [x] Report generated for this repository as proof

## Manual verification notes

The scanner uses heuristics (naming + AST). Items marked `inferred: true` in JSON were classified by filename or pattern rather than explicit declaration. Reviewers should spot-check high-value entries against source files.
