# A3 — Polyglot Mini-System: FastAPI, Node Worker, Rust Engine

**Time box:** 150 minutes  
**Status:** Done

## Goal

Standalone fraud-score mini-system across Python, Node.js, and Rust with a frozen HTTP contract, per-layer tests, integration proof, and documented startup order.

## Architecture

| Service | Port | Role |
|---------|------|------|
| Rust engine | 8782 | Deterministic fraud score computation |
| Node worker | 8781 | Orchestrates engine call, returns process result |
| FastAPI | 8780 | Public ingress — accepts events, stores scores in memory |

**Flow:** Client → FastAPI `POST /events` → Worker `POST /internal/process` → Engine `POST /score` → Worker → FastAPI (in-memory score store) → Client `GET /scores/{id}`

**Scoring rule:** `score = min(100, (amount mod 97) + len(merchant_id))` with threshold-based reasons.

See [contracts/fraud-score-contract.json](contracts/fraud-score-contract.json) for the full contract.

## Run order (three terminals)

Start services **engine → worker → api**:

```bash
# Terminal 1 — Rust engine (:8782)
cd tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/engine
cargo run -- serve

# Terminal 2 — Node worker (:8781)
cd tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/worker
npm install
ENGINE_URL=http://127.0.0.1:8782/score npm start

# Terminal 3 — FastAPI (:8780)
cd tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
WORKER_URL=http://127.0.0.1:8781/internal/process \
  uvicorn src.main:app --host 127.0.0.1 --port 8780
```

### Smoke test

```bash
curl -s http://127.0.0.1:8780/health
curl -s -X POST http://127.0.0.1:8780/events \
  -H 'Content-Type: application/json' \
  -d '{"transaction_id":"tx-demo","amount":150.0,"merchant_id":"m-42"}'
curl -s http://127.0.0.1:8780/scores/tx-demo
```

## Per-layer tests

```bash
# Rust
cd engine && cargo test

# Node worker
cd worker && npm test

# FastAPI
cd api && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && pytest tests/ -v
```

## End-to-end script

Runs all unit tests, then boots the three services and curls the full pipeline:

```bash
cd tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine
bash scripts/e2e.sh | tee artifacts/run-proof.txt
```

## Deliverables

| Artifact | Description |
|----------|-------------|
| [contracts/fraud-score-contract.json](contracts/fraud-score-contract.json) | Frozen HTTP contract across all three services |
| [engine/](engine/) | Rust scoring library + Axum server |
| [worker/](worker/) | Node.js HTTP worker with vitest |
| [api/](api/) | FastAPI ingress with pytest |
| [scripts/e2e.sh](scripts/e2e.sh) | Full integration runner |
| [artifacts/run-proof.txt](artifacts/run-proof.txt) | Captured test + e2e transcript |

## Reviewer UI (live demo)

```bash
cd frontend && npm run dev
```

Open http://localhost:5173 → task **A3** → **Live demo**:

- Start the full polyglot stack via the Vite proxy (ports 8780–8782)
- Submit a fraud event and fetch the computed score
- Run per-layer tests (cargo / vitest / pytest) from the browser
- View saved run proof

## Verification checklist

- [x] Three services with documented ports and health endpoints
- [x] Frozen contract in `contracts/fraud-score-contract.json`
- [x] Unit tests in Rust, Node, and Python
- [x] E2E script exercises live HTTP pipeline
- [x] README documents startup order
- [x] 100% standalone — no dependency on A1/A2/expense-tracker
