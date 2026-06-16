export const I2_TRACE_TARGET = {
  operation: "Create ledger transaction",
  method: "POST",
  path: "/transactions",
  service: "B4 FastAPI transaction ledger",
  entryFile: "tasks/b4-fastapi-greenfield-service/src/main.py",
  entryFunction: "create_transaction",
  entryLines: "28-30",
} as const;

export interface I2FlowStep {
  step: number;
  layer: string;
  file: string;
  function: string;
  lines: string;
  action: string;
  sideEffect: boolean;
}

export const I2_FLOW_STEPS: I2FlowStep[] = [
  {
    step: 1,
    layer: "HTTP server",
    file: "uvicorn (ASGI)",
    function: "HTTP worker",
    lines: "—",
    action: "Receives POST /transactions, dispatches to FastAPI app",
    sideEffect: false,
  },
  {
    step: 2,
    layer: "Routing",
    file: "tasks/b4-fastapi-greenfield-service/src/main.py",
    function: "FastAPI route POST /transactions",
    lines: "28-30",
    action: "Matches path to create_transaction handler",
    sideEffect: false,
  },
  {
    step: 3,
    layer: "Validation",
    file: "tasks/b4-fastapi-greenfield-service/src/schemas.py",
    function: "TransactionCreate (Pydantic)",
    lines: "7-17",
    action: "Validates amount > 0, type credit|debit, description ≤ 200",
    sideEffect: false,
  },
  {
    step: 4,
    layer: "Controller",
    file: "tasks/b4-fastapi-greenfield-service/src/main.py",
    function: "create_transaction",
    lines: "29-30",
    action: "Delegates validated payload to store.create()",
    sideEffect: false,
  },
  {
    step: 5,
    layer: "Persistence",
    file: "tasks/b4-fastapi-greenfield-service/src/store.py",
    function: "TransactionStore.create",
    lines: "25-39",
    action: "Builds TransactionRecord, assigns id, appends to _records",
    sideEffect: true,
  },
  {
    step: 6,
    layer: "Response",
    file: "tasks/b4-fastapi-greenfield-service/src/schemas.py",
    function: "TransactionResponse",
    lines: "20-24",
    action: "Serializes record to JSON; FastAPI returns 201 Created",
    sideEffect: false,
  },
];

export const I2_EXTERNAL_DEPS = [
  "FastAPI — HTTP routing and OpenAPI",
  "Pydantic — request/response validation",
  "Uvicorn — ASGI server (port 8766)",
  "Node http (Path B only) — Vite proxy in vite-plugin-b4-api.ts",
] as const;

export const I2_SIDE_EFFECTS = [
  { type: "In-memory write", detail: "TransactionStore._records.append(record) — store.py:33" },
  { type: "Counter update", detail: "TransactionStore._next_id += 1 — store.py:32" },
  { type: "DB / queue / external API", detail: "None — no SQL, message broker, or outbound HTTP in this flow" },
] as const;

export const I2_UNCERTAINTIES = [
  "No durable database — data lost on process exit or POST /reset",
  "TransactionStore has no locking; multi-worker uvicorn could race on _next_id",
  "422 error body shape depends on FastAPI/Pydantic version (not custom-handled)",
  "Path B proxy startup time varies while uvicorn becomes healthy",
  "B5 Express mirror exists; this trace documents B4 as canonical",
] as const;

export const I2_ARTIFACT_PATHS = {
  flowTrace: "tasks/i2-end-to-end-flow-trace/artifacts/flow-trace.md",
  sequenceDiagram: "tasks/i2-end-to-end-flow-trace/artifacts/sequence-diagram.mmd",
} as const;

export const I2_FLOW_TRACE_VIEWS = [
  { id: "rendered", label: "Rendered sequence" },
  { id: "source", label: "Mermaid source" },
  { id: "trace", label: "Full flow trace" },
] as const;

export type I2FlowTraceView = (typeof I2_FLOW_TRACE_VIEWS)[number]["id"];

export { buildMermaidLiveUrl } from "./i1ErDiagram";
