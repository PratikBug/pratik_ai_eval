# I1 — Entity inventory (pratik_ai_eval)

**Root:** `/Users/pratikwarathe/pratik_ai_eval`  
**Scanned at:** 2026-06-17  
**Time box:** 45 minutes

## Executive summary

This repository is a **coding-agent evaluation workspace** (scanners, greenfield APIs, reviewer UI). It contains **no relational database**: no SQL files, migrations, ORM mappings, `schema.prisma`, docker-compose database services, or datasource configuration.

The only **domain persistence model** is an **in-memory transaction ledger** duplicated in B4 (Python/FastAPI) and B5 (Node/Express). There are **zero foreign keys** and **zero SQL tables**.

| Category | Count |
|----------|------:|
| SQL / migration tables | 0 |
| ORM `@Entity` / `db.Model` classes | 0 |
| Logical in-memory entities | 1 (`Transaction`) |
| Foreign keys (explicit or inferred) | 0 |

---

## Scan methodology

Patterns searched across the full repo (`tasks/`, `frontend/`, root):

| Pattern | Result |
|---------|--------|
| `*.sql`, `CREATE TABLE`, Flyway, Liquibase | Not found |
| `schema.prisma`, Prisma/TypeORM/Sequelize deps | Not found |
| SQLAlchemy, Alembic, Django ORM | Not found |
| JPA `@Entity`, `*.java` | Not found |
| Diesel/SeaORM (Rust) | Not found — B6 uses `clap` only |
| `docker-compose` with postgres/mysql | Not found |
| `.env` / `DATABASE_URL` | Not found |
| B1 inventory scan (`models`, `repositories`) | **0 models, 0 repositories** in [`inventory.json`](../b1-repo-artifact-inventory/artifacts/inventory.json) |

---

## Tables and entities

### 1. `Transaction` (logical entity — in-memory, not a SQL table)

Canonical storage implementations (duplicate domain model):

| Implementation | Storage | Source |
|----------------|---------|--------|
| B4 Python | `list[TransactionRecord]` in `TransactionStore` | `tasks/b4-fastapi-greenfield-service/src/store.py` |
| B5 Node.js | `TransactionRecord[]` in `TransactionStore` | `tasks/b5-nodejs-greenfield-api-or-cli/src/store.ts` |

#### Primary key

| Entity | PK column | Type | Generation | Source |
|--------|-----------|------|------------|--------|
| `Transaction` | `id` | `int` | Auto-increment (`_next_id` / `nextId`) | B4: `store.py:19`, `store.py:27-32`; B5: `store.ts:13`, `store.ts:21-27` |

#### Attributes

| Column | Type (B4) | Type (B5) | Nullable | Validation / notes | Source |
|--------|-------------|-----------|----------|-------------------|--------|
| `id` | `int` | `number` | No | Assigned by store on create | B4: `store.py:10`; B5: `store.ts:6` |
| `amount` | `Decimal` | `string` (decimal) | No | Must be > 0, 2 decimal places | B4: `schemas.py:8-10`; B5: `schemas.ts:4-12` |
| `type` | `"credit" \| "debit"` | `"credit" \| "debit"` | No | Enum-like literal | B4: `schemas.py:9`; B5: `schemas.ts:13` |
| `description` | `Optional[str]` | `string?` | Yes | Max 200 chars when present | B4: `schemas.py:10`; B5: `schemas.ts:14` |

#### API / DTO mirrors (not storage)

| Type | Role | Source |
|------|------|--------|
| `TransactionCreate` | Request body | B4: `schemas.py:7-10`; B5: `schemas.ts:4-15` |
| `TransactionResponse` | Response body | B4: `schemas.py:20-24`; B5: `schemas.ts:18-23` |
| `Transaction` (TS interface) | Frontend UI type | `frontend/src/types/ledger.ts:1-6` |

---

### 2. `Balance` (derived value — **not** a table or entity)

`Balance` is **computed at read time** by aggregating all `Transaction` rows. It is never persisted.

| Field | Type | Source |
|-------|------|--------|
| `balance` | `Decimal` / `string` | B4: `store.py:52-59`, `schemas.py:27-29`; B5: `store.ts:36-41`, `schemas.ts:25-28` |
| `currency` | `"USD"` (constant) | B4: `schemas.py:29`; B5: `schemas.ts:27` |

---

## Foreign keys and relationships

### Explicit foreign keys

**None.** No `FOREIGN KEY`, `@ManyToOne`, `@JoinColumn`, or ORM relationship decorators exist in this repository.

### Inferred relationships

| From | To | Cardinality | Inference | Verdict |
|------|-----|-------------|-----------|---------|
| `Transaction` | `Balance` | N → 1 (computed) | Balance = Σ(credits) − Σ(debits) over all transactions | **Derived aggregate, not an FK relationship** — B4: `store.py:52-59`; B5: `store.ts:36-41` |

No other entity-to-entity relationships exist in-repo.

---

## Structures explicitly excluded (not domain entities)

These are report/metadata shapes, not persisted business tables:

| Structure | Purpose | Source |
|-----------|---------|--------|
| `Inventory` / `Artifact` | B1 scan output | `tasks/b1-repo-artifact-inventory/src/inventory_scanner.py:78-104` |
| `Route` / `EndpointMap` | B2 route scan output | `tasks/b2-api-endpoint-map/src/endpoint_scanner.py` |
| `LogCounts` | B6 CLI counter (ephemeral) | `tasks/b6-rust-greenfield/src/lib.rs:5-10` |
| `Task`, `TasksManifest` | Reviewer UI config | `frontend/public/tasks.json`, `frontend/src/types/tasks.ts` |

---

## External repos (out of scope for this diagram)

B1/B2 demos can scan external Bitbucket repos (e.g. `ramram43210/java_spring_2019`) that may contain real JPA entities and SQL. Those are **not part of this repository** and are not included here.

---

## Mermaid ER diagram

See [`er-diagram.mmd`](./er-diagram.mmd).

Valid Mermaid `erDiagram` with the single logical entity. Balance is documented above as derived, not as a table node.
