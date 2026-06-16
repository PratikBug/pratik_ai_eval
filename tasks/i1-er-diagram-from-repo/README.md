# I1 — ER Diagram from Repo

**Time box:** 45 minutes  
**Status:** Done

## Goal

Build an ER diagram for all tables and entities with cited source files, primary keys, foreign keys, and valid Mermaid ER diagram.

## Finding

**This eval repo has no relational database.** There are no SQL tables, migrations, or ORM entities. The only domain model is an in-memory **`Transaction`** ledger in B4/B5.

## Deliverables

- [`artifacts/entities.md`](artifacts/entities.md) — tables/entities, PKs, FKs, source citations, scan methodology
- [`artifacts/er-diagram.mmd`](artifacts/er-diagram.mmd) — valid Mermaid ER diagram

## View the diagram

Paste `artifacts/er-diagram.mmd` into [Mermaid Live Editor](https://mermaid.live) or any Markdown renderer with Mermaid support.

## Reproduce

Review source files cited in `entities.md`, or re-run B1 inventory to confirm zero ORM models:

```bash
cd tasks/b1-repo-artifact-inventory
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python src/inventory_scanner.py --root ../.. --output artifacts/inventory.json
# Check "models": [] and "repositories": [] in output
```

For a **full database ER diagram exercise**, scan an external repo with real entities (e.g. B1 demo URL `https://bitbucket.org/ramram43210/java_spring_2019`).
