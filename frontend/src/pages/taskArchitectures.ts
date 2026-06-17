export interface FlowStep {
  id: number;
  title: string;
  file: string;
  summary: string;
  detail: string;
  output?: string;
}

export interface FlowNode {
  label: string;
  sub: string;
  step: number;
}

export interface TaskArchitecture {
  taskId: string;
  title: string;
  status: "done" | "pending" | "in_progress";
  overview: string;
  flowNodes: FlowNode[];
  flowSteps: FlowStep[];
  repoStructure: string;
  mermaidDiagram: string;
  runtimeRequirements: string[];
}

function planned(
  taskId: string,
  title: string,
  overview: string,
  flowNodes: FlowNode[],
  flowSteps: Omit<FlowStep, "id">[],
  repoStructure: string,
  mermaidDiagram: string,
  runtimeRequirements: string[],
): TaskArchitecture {
  return {
    taskId,
    title,
    status: "pending",
    overview,
    flowNodes,
    flowSteps: flowSteps.map((step, index) => ({ ...step, id: index + 1 })),
    repoStructure,
    mermaidDiagram,
    runtimeRequirements,
  };
}

const B1: TaskArchitecture = {
  taskId: "B1",
  title: "Repo artifact inventory",
  status: "done",
  overview:
    "Walks a repository (local or Bitbucket clone) and classifies major artifacts — classes, services, controllers, configs, and more — into structured JSON and a Markdown report. The reviewer UI can trigger live scans via a Vite dev-server API.",
  flowNodes: [
    { label: "Reviewer UI", sub: "B1InventoryDemo.tsx", step: 1 },
    { label: "Vite API", sub: "POST /api/b1/scan", step: 2 },
    { label: "scan_repo.py", sub: "orchestrator", step: 2 },
    { label: "repo_source.py", sub: "git clone", step: 3 },
    { label: "inventory_scanner.py", sub: "classify artifacts", step: 4 },
    { label: "render_report.py", sub: "Markdown report", step: 5 },
    { label: "Results in browser", sub: "summary + report", step: 6 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Reviewer pastes a Bitbucket URL",
      file: "frontend/src/components/B1InventoryDemo.tsx",
      summary: "The B1 task page collects a Bitbucket web or git URL and optional branch override.",
      detail:
        "Client-side validation ensures the URL is a Bitbucket repository before any network call.",
    },
    {
      id: 2,
      title: "Browser calls the scan API",
      file: "frontend/vite-plugin-b1-scan.ts → POST /api/b1/scan",
      summary: "The UI sends JSON { repoUrl, branch? } to the Vite dev-server middleware.",
      detail:
        "fetch('/api/b1/scan') runs only while npm run dev (or preview) is active. The plugin spawns the Python scanner on the host machine.",
    },
    {
      id: 3,
      title: "Repository is cloned with git",
      file: "tasks/b1-repo-artifact-inventory/src/repo_source.py",
      summary: "Bitbucket web URLs are normalized to a git clone URL; branch is parsed from /src/branch/ paths.",
      detail: "Runs git clone --depth 1 into a temporary directory. Private repos require local git credentials.",
      output: "Temporary clone directory under the system temp folder",
    },
    {
      id: 4,
      title: "Source files are scanned and classified",
      file: "tasks/b1-repo-artifact-inventory/src/inventory_scanner.py",
      summary: "Walks the tree, skipping vendor/build dirs, and classifies artifacts by language.",
      detail:
        "Python uses AST; Java, TypeScript, Go, and Rust use regex. Naming heuristics detect services, controllers, repositories, configs, and utilities.",
      output: "inventory.json with categorized artifact lists",
    },
    {
      id: 5,
      title: "Markdown report is rendered",
      file: "tasks/b1-repo-artifact-inventory/src/render_report.py",
      summary: "Structured JSON is converted into a reviewer-friendly Markdown report.",
      detail: "Summary table plus sections per category. Inferred items are marked in the output.",
      output: "*-inventory-report.md",
    },
    {
      id: 6,
      title: "Results return to the reviewer UI",
      file: "frontend/src/components/B1InventoryDemo.tsx",
      summary: "The API responds with inventory, summary counts, and the Markdown report text.",
      detail: "The UI shows source URL, branch, files scanned, a category summary grid, and the full report preview.",
      output: "Live inventory visible in the browser",
    },
  ],
  repoStructure: `pratik_ai_eval/
├── frontend/
│   ├── src/components/B1InventoryDemo.tsx   # URL form + results
│   ├── vite-plugin-b1-scan.ts               # POST /api/b1/scan
│   └── vite.config.ts                       # wires plugin + artifact serving
└── tasks/b1-repo-artifact-inventory/
    ├── src/
    │   ├── scan_repo.py                     # one-command wrapper
    │   ├── repo_source.py                   # Bitbucket URL + git clone
    │   ├── inventory_scanner.py             # multi-language scanner
    │   └── render_report.py                 # JSON → Markdown
    └── artifacts/                           # saved scan outputs (CLI)`,
  mermaidDiagram: `flowchart TD
  A[Reviewer UI\\nB1InventoryDemo] -->|POST /api/b1/scan| B[Vite middleware\\nvite-plugin-b1-scan]
  B -->|spawn python3| C[scan_repo.py]
  C --> D[repo_source.py\\ngit clone]
  D --> E[inventory_scanner.py\\nwalk + classify]
  E --> F[render_report.py\\nMarkdown report]
  F -->|JSON + report| B
  B -->|inventory + summary| A`,
  runtimeRequirements: [
    "npm run dev in frontend/ — enables UI and POST /api/b1/scan",
    "python3 and git on PATH — used by the scanner plugin",
    "Public Bitbucket repos work without login; private repos need local git credentials",
    "Shallow clone (--depth 1) keeps scans fast for reviewer demos",
  ],
};

const B2: TaskArchitecture = {
  taskId: "B2",
  title: "API endpoint map",
  status: "done",
  overview:
    "Scans source files for externally exposed routes — REST APIs, Vite middleware, React Router paths, static assets, and client fetch targets — then emits JSON plus separate API and frontend route reports.",
  flowNodes: [
    { label: "CLI or local scan", sub: "scan_endpoints.py", step: 1 },
    { label: "repo_source.py", sub: "optional git clone", step: 2 },
    { label: "endpoint_scanner.py", sub: "regex + walk", step: 3 },
    { label: "render_endpoint_report.py", sub: "two Markdown files", step: 4 },
    { label: "Artifacts", sub: "api + frontend maps", step: 5 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Scan target is resolved",
      file: "tasks/b2-api-endpoint-map/src/scan_endpoints.py",
      summary: "Accepts --root for a local repo or --repo-url for a Bitbucket clone.",
      detail: "Reuses the same git clone helper as B1 when scanning remote repositories.",
    },
    {
      id: 2,
      title: "Source files are walked",
      file: "tasks/b2-api-endpoint-map/src/endpoint_scanner.py",
      summary: "Skips node_modules, .git, build dirs; scans .py, .java, .ts, .tsx, .go, and more.",
      detail: "Framework-specific regex detects FastAPI, Flask, Spring, Express, Vite middleware, React Router, Next.js, and Go HTTP routes.",
    },
    {
      id: 3,
      title: "Static and client routes are cross-referenced",
      file: "tasks/b2-api-endpoint-map/src/endpoint_scanner.py",
      summary: "public/ assets become static GET routes; fetch() calls mark client consumers.",
      detail: "Client-fetch entries are labeled separately from server-defined routes so reviewers can distinguish definitions from usage.",
      output: "endpoints.json",
    },
    {
      id: 4,
      title: "Reports are rendered",
      file: "tasks/b2-api-endpoint-map/src/render_endpoint_report.py",
      summary: "JSON splits into api-endpoint-map.md and frontend-routes.md.",
      detail: "Tables include method, path, handler, source file:line, framework, and environment notes (e.g. dev/preview only).",
      output: "api-endpoint-map.md, frontend-routes.md",
    },
  ],
  repoStructure: `tasks/b2-api-endpoint-map/
├── src/
│   ├── scan_endpoints.py          # one-command wrapper
│   ├── repo_source.py               # Bitbucket URL + git clone
│   ├── endpoint_scanner.py          # multi-framework route detection
│   └── render_endpoint_report.py    # JSON → Markdown (API + SPA)
└── artifacts/
    ├── endpoints.json
    ├── api-endpoint-map.md
    └── frontend-routes.md`,
  mermaidDiagram: `flowchart TD
  A[scan_endpoints.py] --> B{local or remote?}
  B -->|remote| C[repo_source.py\\ngit clone]
  B -->|local| D[endpoint_scanner.py]
  C --> D
  D --> E[Detect API routes\\nFastAPI/Spring/Express/Vite]
  D --> F[Detect SPA routes\\nReact Router]
  D --> G[Static public/ + fetch targets]
  E --> H[render_endpoint_report.py]
  F --> H
  G --> H
  H --> I[api-endpoint-map.md\\nfrontend-routes.md]`,
  runtimeRequirements: [
    "python3 on PATH — CLI scanner uses stdlib only",
    "git on PATH — required for --repo-url remote scans",
    "Regex heuristics: verify high-value routes manually against source",
    "Vite middleware routes (POST /api/b1/scan, GET /tasks/*) are dev/preview only",
  ],
};

const B3: TaskArchitecture = {
  taskId: "B3",
  title: "Test discovery and execution",
  status: "done",
  overview:
    "Discovers the Vitest test suite in frontend/, lists config and test files, runs npm test via a Vite dev-server API, and shows saved discovery artifacts plus live stdout for reviewer verification.",
  flowNodes: [
    { label: "Reviewer UI", sub: "B3TestDiscoveryDemo.tsx", step: 1 },
    { label: "Vite API", sub: "POST /api/b3/run-tests", step: 2 },
    { label: "Discovery scan", sub: "walk *.test.ts(x)", step: 2 },
    { label: "Vitest run", sub: "npm test", step: 3 },
    { label: "Saved artifacts", sub: "test-discovery.md", step: 4 },
    { label: "Results in browser", sub: "summary + output", step: 5 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Reviewer opens the B3 task page",
      file: "frontend/src/components/B3TestDiscoveryDemo.tsx",
      summary: "Saved discovery report and test-run output load from tasks/b3/artifacts/ on mount.",
      detail:
        "The UI shows framework, config path, commands, and artifact previews before any live run.",
    },
    {
      id: 2,
      title: "Browser calls the test run API",
      file: "frontend/vite-plugin-b3-tests.ts → POST /api/b3/run-tests",
      summary: "The plugin walks frontend/ for Vitest files and spawns npm test in frontend/.",
      detail:
        "Discovery reads package.json for the test script and vitest version; categorizes files as plugin, component, page, or lib.",
    },
    {
      id: 3,
      title: "Vitest executes the suite",
      file: "frontend/package.json → vitest run",
      summary: "All *.test.ts and *.test.tsx files run under jsdom via vite.config.ts.",
      detail: "Stdout is parsed for file/test counts and duration; exit code drives pass/fail badge.",
      output: "Vitest summary lines in browser",
    },
    {
      id: 4,
      title: "Artifacts document the discovery",
      file: "tasks/b3-test-discovery-and-execution/artifacts/",
      summary: "test-discovery.md lists framework, config, files, commands, and failure interpretation.",
      detail: "test-run-output.txt captures proof from the initial discovery run.",
      output: "test-discovery.md, test-run-output.txt",
    },
    {
      id: 5,
      title: "Results return to the reviewer UI",
      file: "frontend/src/components/B3TestDiscoveryDemo.tsx",
      summary: "Live output, discovery table, and saved artifacts display together on the B3 task page.",
      detail: "Summary grid shows test file count, tests passed, and pass/fail status.",
      output: "Live + saved test proof visible in browser",
    },
  ],
  repoStructure: `pratik_ai_eval/
├── frontend/
│   ├── src/components/B3TestDiscoveryDemo.tsx   # discovery UI + run button
│   ├── vite-plugin-b3-tests.ts                  # POST /api/b3/run-tests
│   ├── vite.config.ts                           # Vitest jsdom config
│   └── **/*.test.ts(x)                          # 17 Vitest test files
└── tasks/b3-test-discovery-and-execution/
    └── artifacts/
        ├── test-discovery.md                    # framework + commands
        └── test-run-output.txt                  # captured npm test output`,
  mermaidDiagram: `flowchart TD
  A[Reviewer UI\\nB3TestDiscoveryDemo] -->|POST /api/b3/run-tests| B[Vite middleware\\nvite-plugin-b3-tests]
  B --> C[Walk frontend/\\nfind *.test.ts]
  B -->|spawn npm test| D[Vitest\\njsdom]
  D -->|stdout + exit code| B
  B -->|discovery + summary| A
  E[Saved artifacts\\ntest-discovery.md] --> A`,
  runtimeRequirements: [
    "npm run dev in frontend/ — enables UI and POST /api/b3/run-tests",
    "npm install in frontend/ — Vitest and jsdom must be present",
    "Live run executes the full suite (~3–5s); dev server must stay running",
    "B1/B2 Python scanners are not covered by this test suite",
  ],
};

const B4: TaskArchitecture = {
  taskId: "B4",
  title: "FastAPI greenfield service",
  status: "done",
  overview:
    "Greenfield FastAPI transaction ledger with Pydantic validation, in-memory storage, pytest suite, and a reviewer UI that starts uvicorn on demand, proxies API calls, and runs pytest live.",
  flowNodes: [
    { label: "Reviewer UI", sub: "B4FastApiDemo.tsx", step: 1 },
    { label: "Vite API", sub: "POST /api/b4/run-tests", step: 2 },
    { label: "Uvicorn", sub: "src.main:app", step: 3 },
    { label: "FastAPI routes", sub: "transactions + balance", step: 4 },
    { label: "pytest", sub: "TestClient tests", step: 2 },
    { label: "Results in browser", sub: "API + test output", step: 5 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Reviewer opens the B4 task page",
      file: "frontend/src/components/B4FastApiDemo.tsx",
      summary: "UI loads saved run proof and starts the FastAPI service via the Vite proxy.",
      detail: "GET /api/b4/service/health triggers uvicorn if not already running on port 8766.",
    },
    {
      id: 2,
      title: "Live API calls through the proxy",
      file: "frontend/vite-plugin-b4-api.ts → /api/b4/service/*",
      summary: "POST /transactions and GET /transactions, /balance are proxied to the FastAPI app.",
      detail: "In-memory ledger resets via POST /reset for repeatable demos.",
    },
    {
      id: 3,
      title: "FastAPI validates and stores transactions",
      file: "tasks/b4-fastapi-greenfield-service/src/",
      summary: "Pydantic models enforce amount > 0, credit/debit type, and optional description length.",
      detail: "store.py keeps an in-memory list and computes balance as credits minus debits.",
    },
    {
      id: 4,
      title: "Reviewer runs pytest from the browser",
      file: "frontend/vite-plugin-b4-api.ts → POST /api/b4/run-tests",
      summary: "Spawns pytest -v in the B4 task directory and streams stdout to the UI.",
      detail: "Five tests cover create, list, balance, and validation error responses.",
      output: "Live pytest output in browser",
    },
  ],
  repoStructure: `tasks/b4-fastapi-greenfield-service/
├── src/main.py          # FastAPI app + routes
├── src/schemas.py       # Pydantic models
├── src/store.py         # In-memory ledger
├── tests/test_api.py    # pytest + TestClient
└── artifacts/run-proof.txt

frontend/
├── src/components/B4FastApiDemo.tsx
└── vite-plugin-b4-api.ts`,
  mermaidDiagram: `flowchart TD
  A[Reviewer UI\\nB4FastApiDemo] -->|/api/b4/service/*| B[Vite proxy\\nvite-plugin-b4-api]
  B -->|spawn uvicorn| C[FastAPI\\ntransactions + balance]
  A -->|POST /api/b4/run-tests| B
  B -->|pytest -v| D[tests/test_api.py]
  D -->|stdout| A
  C -->|JSON| B
  B --> A`,
  runtimeRequirements: [
    "B4 venv: cd tasks/b4-fastapi-greenfield-service && python3 -m venv .venv && pip install -r requirements.txt",
    "npm run dev in frontend/ — enables UI, proxy, and live pytest",
    "Uvicorn starts automatically on first API call (port 8766)",
  ],
};

const B5: TaskArchitecture = {
  taskId: "B5",
  title: "Node.js greenfield API",
  status: "done",
  overview:
    "Express + Zod reimplementation of the B4 transaction ledger with the same REST contract, Vitest + supertest coverage, and a reviewer UI that proxies the API and runs tests live.",
  flowNodes: [
    { label: "Reviewer UI", sub: "B5NodeApiDemo.tsx", step: 1 },
    { label: "Vite API", sub: "/api/b5/service/*", step: 2 },
    { label: "Express app", sub: "src/app.ts", step: 3 },
    { label: "Zod validation", sub: "schemas.ts", step: 3 },
    { label: "Vitest", sub: "supertest", step: 2 },
    { label: "Results in browser", sub: "API + test output", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Reviewer opens the B5 task page",
      file: "frontend/src/components/B5NodeApiDemo.tsx",
      summary: "UI loads run proof and starts the Express API through the Vite proxy.",
      detail: "GET /api/b5/service/health spawns tsx src/index.ts on port 8767 if needed.",
    },
    {
      id: 2,
      title: "Live API calls mirror B4",
      file: "tasks/b5-nodejs-greenfield-api-or-cli/src/app.ts",
      summary: "POST/GET /transactions and GET /balance with identical JSON shapes to B4.",
      detail: "Zod validates amount > 0 and credit/debit type; store.ts computes running balance.",
    },
    {
      id: 3,
      title: "Vitest suite runs from the browser",
      file: "frontend/vite-plugin-b5-api.ts → POST /api/b5/run-tests",
      summary: "npm test in the B5 task folder; stdout shown in the UI.",
      detail: "Twelve tests cover money parsing, store, schemas, and HTTP routes.",
      output: "Live Vitest output in browser",
    },
  ],
  repoStructure: `tasks/b5-nodejs-greenfield-api-or-cli/
├── src/app.ts           # Express routes
├── src/schemas.ts       # Zod validation
├── src/store.ts         # In-memory ledger
├── tests/app.test.ts    # supertest (mirrors B4)
└── artifacts/run-proof.txt

frontend/
├── src/components/B5NodeApiDemo.tsx
└── vite-plugin-b5-api.ts`,
  mermaidDiagram: `flowchart TD
  A[Reviewer UI\\nB5NodeApiDemo] -->|/api/b5/service/*| B[Vite proxy]
  B -->|spawn tsx| C[Express API]
  A -->|POST /api/b5/run-tests| B
  B -->|npm test| D[Vitest + supertest]
  C -->|JSON| B
  B --> A`,
  runtimeRequirements: [
    "cd tasks/b5-nodejs-greenfield-api-or-cli && npm install",
    "npm run dev in frontend/ — enables UI proxy and live Vitest",
    "Express starts on port 8767 on first proxied request",
  ],
};

const B6: TaskArchitecture = {
  taskId: "B6",
  title: "Rust greenfield",
  status: "done",
  overview:
    "Rust CLI built with clap that streams a log file line-by-line, counts INFO/WARN/ERROR tokens, handles missing files with a clear error, ships six cargo tests, and exposes a reviewer UI that runs cargo test and the CLI live.",
  flowNodes: [
    { label: "Reviewer UI", sub: "B6RustDemo.tsx", step: 1 },
    { label: "Vite API", sub: "POST /api/b6/*", step: 2 },
    { label: "cargo test", sub: "6 tests", step: 2 },
    { label: "cargo run", sub: "log-counter CLI", step: 3 },
    { label: "Counts", sub: "INFO/WARN/ERROR", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Reviewer opens the B6 task page",
      file: "frontend/src/components/B6RustDemo.tsx",
      summary: "Saved run proof loads on mount; buttons trigger cargo test and cargo run.",
      detail: "POST /api/b6/run-tests and POST /api/b6/run-cli spawn cargo in tasks/b6-rust-greenfield/.",
    },
    {
      id: 2,
      title: "CLI accepts a log file path",
      file: "tasks/b6-rust-greenfield/src/main.rs",
      summary: "clap parses a single positional file argument.",
      detail: "Missing files print to stderr and exit 1 without panicking.",
    },
    {
      id: 3,
      title: "Lines are classified and counted",
      file: "tasks/b6-rust-greenfield/src/lib.rs",
      summary: "BufRead streaming counts whole-word INFO, WARN, ERROR tokens per line.",
      detail: "ERROR takes precedence over WARN over INFO when multiple tokens appear on one line.",
      output: "INFO: N\\nWARN: N\\nERROR: N",
    },
    {
      id: 4,
      title: "Tests verify parser and CLI",
      file: "tasks/b6-rust-greenfield/tests/cli_integration.rs",
      summary: "Unit tests cover counts, missing file, empty file; integration tests exercise the binary.",
      detail: "assert_cmd runs the compiled log-counter against temp files and missing paths.",
      output: "cargo test — 6 passed",
    },
  ],
  repoStructure: `tasks/b6-rust-greenfield/
├── Cargo.toml
├── src/lib.rs           # counting logic + unit tests
├── src/main.rs          # clap CLI
├── tests/cli_integration.rs
├── sample.log
└── artifacts/run-proof.txt

frontend/
├── src/components/B6RustDemo.tsx
└── vite-plugin-b6-rust.ts`,
  mermaidDiagram: `flowchart TD
  A[Reviewer UI\\nB6RustDemo] -->|POST /api/b6/run-tests| B[Vite plugin]
  A -->|POST /api/b6/run-cli| B
  B -->|cargo test| C[6 tests]
  B -->|cargo run| D[log-counter CLI]
  D --> E[INFO/WARN/ERROR counts]
  C --> A
  E --> A`,
  runtimeRequirements: [
    "Rust toolchain (cargo + rustc) on PATH",
    "npm run dev in frontend/ — enables live cargo test + CLI demo",
    "First cargo run may compile dependencies (~20s)",
  ],
};

const I1: TaskArchitecture = {
  taskId: "I1",
  title: "ER diagram from repo",
  status: "done",
  overview:
    "Reverse-engineered entity inventory for pratik_ai_eval: no SQL/ORM tables exist; one in-memory Transaction entity (B4/B5) documented with PKs, zero FKs, and a valid Mermaid ER diagram with file citations.",
  flowNodes: [
    { label: "Repo scan", sub: "SQL/ORM/migrations", step: 1 },
    { label: "Entity extract", sub: "B4/B5 store", step: 2 },
    { label: "Citations", sub: "file:line per claim", step: 3 },
    { label: "ER diagram", sub: "er-diagram.mmd", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Scan for schema sources",
      file: "tasks/i1-er-diagram-from-repo/artifacts/entities.md",
      summary: "Search SQL, migrations, ORM models, Prisma, docker-compose DB — none found in this repo.",
      detail: "B1 inventory confirms models: [] and repositories: [] for pratik_ai_eval.",
    },
    {
      id: 2,
      title: "Document logical Transaction entity",
      file: "tasks/b4-fastapi-greenfield-service/src/store.py",
      summary: "PK id (auto-increment), attributes amount/type/description; mirrored in B5 store.ts.",
      detail: "Balance is computed aggregate, not a persisted table.",
    },
    {
      id: 3,
      title: "Render Mermaid ER diagram",
      file: "tasks/i1-er-diagram-from-repo/artifacts/er-diagram.mmd",
      summary: "Single TRANSACTION entity with PK and attributes; no FK edges.",
      detail: "Valid erDiagram syntax; view in Mermaid Live Editor.",
      output: "entities.md + er-diagram.mmd",
    },
  ],
  repoStructure: `tasks/i1-er-diagram-from-repo/
└── artifacts/
    ├── entities.md      # tables, PKs, FKs, citations
    └── er-diagram.mmd     # Mermaid ER diagram`,
  mermaidDiagram: `flowchart TD
  A[Repo root] --> B[Scan SQL/ORM/migrations]
  B --> C{Found DB schema?}
  C -->|No| D[Document in-memory Transaction]
  C -->|Yes| E[Extract entities + FKs]
  D --> F[entities.md with citations]
  F --> G[er-diagram.mmd]`,
  runtimeRequirements: [
    "Read-only repo analysis — no build required",
    "Optional: Mermaid Live Editor to render er-diagram.mmd",
    "For rich ER diagrams: scan external repo via B1 (e.g. java_spring_2019)",
  ],
};

const I2: TaskArchitecture = {
  taskId: "I2",
  title: "End-to-end flow trace",
  status: "done",
  overview:
    "Traced POST /transactions on B4 FastAPI from HTTP entry (and optional reviewer UI proxy) through Pydantic validation to TransactionStore in-memory append, with sequence diagram and uncertainty notes.",
  flowNodes: [
    { label: "Entry point", sub: "POST /transactions", step: 1 },
    { label: "Validation", sub: "TransactionCreate", step: 2 },
    { label: "Store write", sub: "store.create()", step: 3 },
    { label: "Sequence diagram", sub: "sequence-diagram.mmd", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Document entry point",
      file: "tasks/b4-fastapi-greenfield-service/src/main.py",
      summary: "create_transaction handler at lines 28-30; alternate UI path via B4FastApiDemo + vite-plugin-b4-api.",
      detail: "Path A: direct uvicorn. Path B: /api/b4/service/transactions proxy.",
    },
    {
      id: 2,
      title: "Map file and function chain",
      file: "tasks/i2-end-to-end-flow-trace/artifacts/flow-trace.md",
      summary: "Six-step table from Uvicorn → FastAPI → Pydantic → store.create → _records append.",
      detail: "Cites main.py, schemas.py, store.py with line numbers.",
    },
    {
      id: 3,
      title: "Document side effects and dependencies",
      file: "tasks/i2-end-to-end-flow-trace/artifacts/flow-trace.md",
      summary: "In-memory list mutation only; FastAPI/Pydantic/Uvicorn deps; no DB/queue/external API.",
      detail: "Seven uncertainty items including concurrency and B5 mirror.",
    },
    {
      id: 4,
      title: "Build sequence diagram",
      file: "tasks/i2-end-to-end-flow-trace/artifacts/sequence-diagram.mmd",
      summary: "Mermaid sequenceDiagram for Path A and Path B with validation alt branch.",
      detail: "Rendered in I2FlowTraceDemo via MermaidDiagram component.",
      output: "flow-trace.md + sequence-diagram.mmd",
    },
  ],
  repoStructure: `tasks/i2-end-to-end-flow-trace/
└── artifacts/
    ├── flow-trace.md           # full trace with citations
    └── sequence-diagram.mmd    # Mermaid sequence diagram

frontend/src/components/I2FlowTraceDemo.tsx  # live UI demo`,
  mermaidDiagram: `sequenceDiagram
  Client->>Uvicorn: POST /transactions
  Uvicorn->>FastAPI: route match
  FastAPI->>Pydantic: validate body
  Pydantic-->>Client: 422 if invalid
  FastAPI->>Store: store.create()
  Store->>Memory: append _records
  Store-->>Client: 201 TransactionResponse`,
  runtimeRequirements: [
    "Read-only analysis — no build required to view artifacts",
    "Optional: B4 uvicorn on :8766 to reproduce curl trace",
    "frontend npm run dev for I2FlowTraceDemo rendered sequence",
  ],
};

const I3: TaskArchitecture = {
  taskId: "I3",
  title: "Small safe change in unfamiliar repo",
  status: "done",
  overview:
    "Minimal one-line fix in unfamiliar B6 Rust log-counter: case-insensitive level token matching in line_contains_level, with new unit test, patch, risk assessment, and agent vs manual verification.",
  flowNodes: [
    { label: "Read module", sub: "b6 lib.rs", step: 1 },
    { label: "Minimal diff", sub: "1 line + test", step: 2 },
    { label: "cargo test", sub: "7 passed", step: 3 },
    { label: "Risk note", sub: "rollback plan", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Scope change in unfamiliar crate",
      file: "tasks/b6-rust-greenfield/src/lib.rs",
      summary: "Target line_contains_level — lowercase log lines were ignored.",
      detail: "Explored lib.rs, main.rs, cli_integration.rs before editing.",
    },
    {
      id: 2,
      title: "Apply minimal diff + test",
      file: "tasks/i3-small-safe-change-in-unfamiliar-repo/artifacts/change.patch",
      summary: "eq_ignore_ascii_case instead of ==; counts_case_insensitive_log_levels test.",
      detail: "Branch i3/case-insensitive-log-levels on stage.",
    },
    {
      id: 3,
      title: "Verify and document",
      file: "tasks/i3-small-safe-change-in-unfamiliar-repo/artifacts/change-summary.md",
      summary: "cargo test 7/7; agent vs manual table; test-output.txt saved.",
      detail: "I3SafeChangeDemo re-runs /api/b6/run-tests in reviewer UI.",
      output: "change-summary.md + risk-assessment.md + change.patch",
    },
  ],
  repoStructure: `tasks/i3-small-safe-change-in-unfamiliar-repo/
└── artifacts/
    ├── change-summary.md
    ├── risk-assessment.md
    ├── change.patch
    └── test-output.txt

tasks/b6-rust-greenfield/src/lib.rs   # 1-line fix + test

frontend/src/components/I3SafeChangeDemo.tsx`,
  mermaidDiagram: `flowchart TD
  A[Read b6 lib.rs] --> B[Identify case mismatch]
  B --> C[Fix line_contains_level]
  C --> D[Add unit test]
  D --> E[cargo test 7/7]
  E --> F[risk-assessment.md]`,
  runtimeRequirements: [
    "Rust toolchain + cargo for B6 tests",
    "frontend npm run dev for I3SafeChangeDemo",
  ],
};

const I4: TaskArchitecture = {
  taskId: "I4",
  title: "Polyglot service pair: FastAPI plus Node client",
  status: "done",
  overview:
    "FastAPI currency converter on :8768 with POST /convert (hardcoded USD/EUR/GBP/INR rates, Pydantic validation) and Node.js CLI client with vitest + scripted verify; I4PolyglotDemo in reviewer UI.",
  flowNodes: [
    { label: "FastAPI service", sub: "POST /convert", step: 1 },
    { label: "Node CLI", sub: "tsx src/cli.ts", step: 2 },
    { label: "Tests both sides", sub: "pytest + vitest", step: 3 },
    { label: "Two-terminal README", sub: "uvicorn then CLI", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "FastAPI /convert with validation",
      file: "tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api/src/main.py",
      summary: "ConvertRequest amount > 0; supported currencies; hardcoded rates in converter.py.",
      detail: "10 pytest cases; GET /health and GET /rates.",
    },
    {
      id: 2,
      title: "Node CLI client",
      file: "tasks/i4-polyglot-service-pair-fastapi-plus-node-client/client/src/cli.ts",
      summary: "parseCliArgs + convertCurrency POST to running API; npm run verify script.",
      detail: "6 vitest tests with mocked fetch for client + CLI arg parsing.",
    },
    {
      id: 3,
      title: "Reviewer UI demo",
      file: "frontend/vite-plugin-i4-api.ts",
      summary: "Proxy /api/i4/service → :8768; run-api-tests, run-client-tests, run-cli.",
      detail: "I4PolyglotDemo.tsx live convert + test buttons.",
      output: "README two-terminal instructions + artifacts/run-proof.txt",
    },
  ],
  repoStructure: `tasks/i4-polyglot-service-pair-fastapi-plus-node-client/
├── api/              # FastAPI + pytest
├── client/           # Node CLI + vitest
├── artifacts/run-proof.txt
└── README.md

frontend/vite-plugin-i4-api.ts
frontend/src/components/I4PolyglotDemo.tsx`,
  mermaidDiagram: `flowchart LR
  CLI[Node CLI] -->|POST /convert| API[FastAPI :8768]
  API --> R[JSON response]
  R --> CLI`,
  runtimeRequirements: [
    "Python 3 + api/.venv for uvicorn/pytest",
    "Node.js + client/npm install for CLI and vitest",
    "Port 8768 free for I4 API",
    "frontend npm run dev for I4PolyglotDemo",
  ],
};

const I5: TaskArchitecture = {
  taskId: "I5",
  title: "Dockerize and run",
  status: "done",
  overview:
    "Dockerized I4 convert FastAPI as pratik-i5-convert-api:latest on port 8080 — slim Python image, non-root user, HEALTHCHECK, docker-compose, verify-docker.sh, and I5DockerDemo.",
  flowNodes: [
    { label: "Dockerfile", sub: "slim + HEALTHCHECK", step: 1 },
    { label: "docker build", sub: "api context", step: 2 },
    { label: "docker run", sub: "port 8080", step: 3 },
    { label: "curl proof", sub: "/health + /convert", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Production Dockerfile",
      file: "tasks/i5-dockerize-and-run/Dockerfile",
      summary: "python:3.11-slim, requirements-docker.txt only, non-root app user, curl HEALTHCHECK.",
      detail: "Build context: I4 api/ with .dockerignore excluding .venv and tests.",
    },
    {
      id: 2,
      title: "Compose + verify script",
      file: "tasks/i5-dockerize-and-run/docker-compose.yml",
      summary: "docker compose up --build; scripts/verify-docker.sh captures build + curl proofs.",
      detail: "scripts/smoke-local.sh fallback when Docker daemon unavailable.",
    },
    {
      id: 3,
      title: "Reviewer UI",
      file: "frontend/vite-plugin-i5-docker.ts",
      summary: "I5DockerDemo runs verify or smoke; displays Dockerfile and proof artifacts.",
      output: "build-proof.txt + curl-proof.txt",
    },
  ],
  repoStructure: `tasks/i5-dockerize-and-run/
├── Dockerfile
├── docker-compose.yml
├── scripts/verify-docker.sh
├── scripts/smoke-local.sh
└── artifacts/
    ├── build-proof.txt
    └── curl-proof.txt

frontend/vite-plugin-i5-docker.ts
frontend/src/components/I5DockerDemo.tsx`,
  mermaidDiagram: `flowchart TD
  A[I4 FastAPI api/] --> B[docker build]
  B --> C[pratik-i5-convert-api]
  C --> D[docker run :8080]
  D --> E[curl /health]`,
  runtimeRequirements: [
    "Docker Desktop for full verify-docker.sh",
    "curl for health proof",
    "Python venv for smoke-local.sh fallback",
    "frontend npm run dev for I5DockerDemo",
  ],
};

const I6: TaskArchitecture = {
  taskId: "I6",
  title: "Bug diagnosis with agent",
  status: "done",
  overview:
    "Diagnosed seeded off-by-one in Acme shipping calculator (>) vs >= at $50.00 threshold): reproduce via show-buggy-behavior.py, one-line fix in shipping.py, 4/4 pytest green, I6BugDiagnosisDemo for reviewers.",
  flowNodes: [
    { label: "Reproduce", sub: "show-bug script", step: 1 },
    { label: "Root cause", sub: "shipping.py:11", step: 2 },
    { label: "Minimal fix", sub: "> to >=", step: 3 },
    { label: "Verify", sub: "pytest 4/4", step: 4 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Reproduce seeded bug",
      file: "tasks/i6-bug-diagnosis-with-agent/scripts/show-buggy-behavior.py",
      summary: "$50.00 subtotal shows $5.99 shipping with buggy > operator.",
      detail: "test_free_shipping_at_exactly_fifty_dollars fails before fix.",
    },
    {
      id: 2,
      title: "Document root cause and patch",
      file: "tasks/i6-bug-diagnosis-with-agent/artifacts/bug-report.md",
      summary: "calculate_shipping in shipping.py; inclusive threshold requires >=.",
      detail: "seeded-bug.patch shows one-line diff.",
    },
    {
      id: 3,
      title: "Verify fix",
      file: "tasks/i6-bug-diagnosis-with-agent/artifacts/fix-verification.txt",
      summary: "pytest -v: 4 passed including at-threshold case.",
      detail: "I6BugDiagnosisDemo runs live reproduce + pytest via vite plugin.",
      output: "bug-report.md + fix-verification.txt",
    },
  ],
  repoStructure: `tasks/i6-bug-diagnosis-with-agent/
├── service/src/shipping.py
├── service/tests/test_shipping.py
├── scripts/show-buggy-behavior.py
└── artifacts/
    ├── bug-report.md
    ├── seeded-bug.patch
    └── fix-verification.txt

frontend/vite-plugin-i6-bug.ts
frontend/src/components/I6BugDiagnosisDemo.tsx`,
  mermaidDiagram: `flowchart TD
  A[Subtotal $50.00] --> B{buggy > 5000?}
  B -->|false| C[Charge $5.99 BUG]
  B -->|fixed >= 5000| D[Free shipping]`,
  runtimeRequirements: [
    "Python 3 + pytest for service/",
    "frontend npm run dev for I6BugDiagnosisDemo",
  ],
};

const A1: TaskArchitecture = {
  taskId: "A1",
  title: "Multi-worktree parallel plan",
  status: "done",
  overview:
    "Planning-only Advanced task: document how to split the Expense Tracker REST API into three parallel git worktrees (data layer, API routes, test suite) with frozen SHARED_CONTRACT, per-lane agent prompts, merge order, conflict playbook, and verification gates — without merge chaos.",
  flowNodes: [
    { label: "Pick feature task", sub: "Expense Tracker API", step: 1 },
    { label: "Shared contract", sub: "SHARED_CONTRACT.md", step: 2 },
    { label: "Task decomposition", sub: "3 lanes by directory", step: 3 },
    { label: "Worktree map", sub: "branch per lane", step: 4 },
    { label: "Agent prompts", sub: "copy-paste per lane", step: 5 },
    { label: "Merge order", sub: "data → api → tests", step: 6 },
    { label: "Verify gates", sub: "pytest + conflict check", step: 7 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Choose a feature that splits by file ownership",
      file: "tasks/a1-multi-worktree-parallel-plan/artifacts/parallel-plan.md",
      summary:
        "Example: Expense Tracker with POST/GET /transactions and GET /balance — decomposed into data, API, and test lanes.",
      detail:
        "Condition: lanes must touch disjoint path sets (app/models.py vs app/routes/ vs tests/). Do not split by layer across all files (e.g. all tests in one lane while all code in another) if that creates cross-lane edits.",
    },
    {
      id: 2,
      title: "Land frozen contract before parallel work",
      file: "tasks/a1-multi-worktree-parallel-plan/artifacts/shared-contract.md",
      summary:
        "Transaction model fields, API routes, file layout, Python 3.11, FastAPI, SQLite, port 8000 — immutable after merge to main.",
      detail:
        "Condition: no lane starts until SHARED_CONTRACT is committed. Any lane needing model or route shape reads the contract; no silent drift.",
      output: "shared-contract.md",
    },
    {
      id: 3,
      title: "Document worktrees and branch names",
      file: "tasks/a1-multi-worktree-parallel-plan/artifacts/parallel-plan.md",
      summary:
        "feat/data-layer, feat/api-endpoints, feat/tests — sibling worktrees via git worktree add ../expense-tracker-{lane}.",
      detail:
        "Condition: each worktree checks out one branch; supervisor runs git worktree list to confirm isolation. Lane must not edit files outside its owned directory table.",
    },
    {
      id: 4,
      title: "Write agent prompt per lane with must-not-touch rules",
      file: "tasks/a1-multi-worktree-parallel-plan/artifacts/parallel-plan.md",
      summary:
        "Lane 1: models + DB. Lane 2: FastAPI routes + schemas + requirements.txt. Lane 3: pytest only.",
      detail:
        "Condition: prompts include deliverables, verify command (pytest/npm test), commit message format, and explicit forbidden paths. Lane 2 imports models but does not create models.py.",
    },
    {
      id: 5,
      title: "Define shared constraints and merge order",
      file: "tasks/a1-multi-worktree-parallel-plan/artifacts/parallel-plan.md",
      summary:
        "7 global rules (frameworks, imports, frozen contract, no drive-by edits). Merge: data → api → tests.",
      detail:
        "Condition: merge data first (routes/tests depend on models). Merge API second. Merge tests last. Use git merge --no-ff for audit trail.",
    },
    {
      id: 6,
      title: "Conflict/risk plan and verification gates",
      file: "tasks/a1-multi-worktree-parallel-plan/artifacts/parallel-plan.md",
      summary:
        "Risk table: app/__init__.py collision, requirements drift, import paths. Verify: pytest, curl smoke, grep for conflict markers.",
      detail:
        "Condition: pre-merge git diff --name-only must stay within owned paths. On conflict, keep version matching SHARED_CONTRACT. Re-run pytest after each merge.",
      output: "supervisor-checklist.md",
    },
    {
      id: 7,
      title: "Optional local execution proof",
      file: "tasks/a1-multi-worktree-parallel-plan/artifacts/run-proof.txt",
      summary:
        "Example git worktree list, merge graph, pytest output, and curl responses from running the plan locally.",
      detail:
        "Not required for A1 completion — the plan document is the primary deliverable. run-proof.txt shows the supervisor workflow in practice.",
      output: "run-proof.txt",
    },
  ],
  repoStructure: `tasks/a1-multi-worktree-parallel-plan/
├── README.md
└── artifacts/
    ├── parallel-plan.md        # 7-section plan (primary deliverable)
    ├── shared-contract.md      # frozen model + API contract
    ├── supervisor-checklist.md # 45-min live demo runbook
    └── run-proof.txt           # optional execution example`,
  mermaidDiagram: `flowchart TD
  Feature[Expense Tracker API] --> Contract[SHARED_CONTRACT.md]
  Contract --> W1[worktree feat/data-layer]
  Contract --> W2[worktree feat/api-endpoints]
  Contract --> W3[worktree feat/tests]
  W1 --> M1[merge data]
  M1 --> M2[merge api]
  W2 --> M2
  M2 --> M3[merge tests]
  W3 --> M3
  M3 --> Verify[pytest + curl + conflict grep]`,
  runtimeRequirements: [
    "git with worktree support (git worktree add)",
    "Clean base branch before creating worktrees",
    "Supervisor reads parallel-plan.md + shared-contract.md before dispatching agents",
    "Optional local demo: Python 3.11, FastAPI, pytest for execution proof",
  ],
};

const A2: TaskArchitecture = {
  taskId: "A2",
  title: "Execute two parallel worktrees",
  status: "done",
  overview:
    "Execution Advanced task: two git worktrees (data + API lanes) merged into sandbox/expense-tracker, documented in merge-proof.md. Reviewer UI runs live pytest and curl smoke against the merged app via A2WorktreeDemo and vite-plugin-a2-worktree.",
  flowNodes: [
    { label: "Bootstrap sandbox", sub: "SHARED_CONTRACT on main", step: 1 },
    { label: "Worktree A", sub: "feat/a2-data-layer", step: 2 },
    { label: "Worktree B", sub: "feat/a2-api-endpoints", step: 3 },
    { label: "Merge data", sub: "--no-ff to main", step: 4 },
    { label: "Merge API", sub: "--no-ff to main", step: 5 },
    { label: "Post-merge tests", sub: "pytest + curl", step: 6 },
    { label: "merge-proof.md", sub: "full transcript", step: 7 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Bootstrap nested repo and shared contract",
      file: "tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker/SHARED_CONTRACT.md",
      summary:
        "git init under sandbox/expense-tracker/; commit SHARED_CONTRACT before any parallel lane.",
      detail:
        "Condition: main checkout is the merge target. Contract freezes Transaction fields and three API routes. No lane starts until this commit exists.",
    },
    {
      id: 2,
      title: "Create two worktrees with git worktree add",
      file: "tasks/a2-execute-two-parallel-worktrees/artifacts/merge-proof.md",
      summary:
        "git branch feat/a2-data-layer; git worktree add ../expense-tracker-lane-a; same for feat/a2-api-endpoints → lane-b.",
      detail:
        "Condition: sibling directories under sandbox/; git worktree list must show three entries (main + two lanes). Lane worktrees are gitignored after cleanup.",
      output: "lane-a-output.txt, lane-b-output.txt",
    },
    {
      id: 3,
      title: "Lane A — implement data layer only",
      file: "tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker-lane-a/app/models.py",
      summary:
        "SQLAlchemy Transaction model, database.py session factory, config.py — commit feat(a2-data):.",
      detail:
        "Condition: must NOT touch app/routes/ or tests/. Verify with python import check; capture output to lane-a-output.txt.",
    },
    {
      id: 4,
      title: "Lane B — implement API layer only",
      file: "tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker-lane-b/app/main.py",
      summary:
        "FastAPI app, routes, schemas, requirements.txt — commit feat(a2-api):.",
      detail:
        "Condition: must NOT create models.py. Lane B uses py_compile until data layer is merged. Capture lane-b-output.txt.",
    },
    {
      id: 5,
      title: "Merge and reconcile on main",
      file: "tasks/a2-execute-two-parallel-worktrees/artifacts/merge-proof.md",
      summary:
        "git merge feat/a2-data-layer --no-ff; then git merge feat/a2-api-endpoints --no-ff.",
      detail:
        "Condition: merge data before API (routes import models). Expected app/__init__.py overlap — identical empty files auto-merged with no manual conflict.",
    },
    {
      id: 6,
      title: "Add tests on main and verify",
      file: "tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker/tests/",
      summary:
        "5 pytest tests + curl smoke on POST/GET /transactions and GET /balance.",
      detail:
        "Condition: tests are NOT a third parallel lane — added only after both merges. final-test-output.txt captures pytest and curl proof.",
      output: "final-test-output.txt",
    },
    {
      id: 7,
      title: "Reviewer live demo",
      file: "frontend/src/components/A2WorktreeDemo.tsx",
      summary:
        "Load merge proof artifacts; run POST /api/a2/run-tests and POST /api/a2/smoke; POST transactions via /api/a2/service proxy.",
      detail:
        "Vite plugin auto-creates sandbox .venv if missing. Port 8775 for merged Expense Tracker API in this eval repo only.",
      output: "merge-proof.md",
    },
  ],
  repoStructure: `tasks/a2-execute-two-parallel-worktrees/
├── README.md
├── artifacts/
│   ├── merge-proof.md
│   ├── lane-a-output.txt
│   ├── lane-b-output.txt
│   └── final-test-output.txt
└── sandbox/expense-tracker/
    ├── app/
    ├── tests/
    └── requirements.txt

frontend/vite-plugin-a2-worktree.ts
frontend/src/components/A2WorktreeDemo.tsx`,
  mermaidDiagram: `flowchart TD
  main[main sandbox/expense-tracker] --> contract[SHARED_CONTRACT]
  contract --> laneA[worktree lane-a feat/a2-data-layer]
  contract --> laneB[worktree lane-b feat/a2-api-endpoints]
  laneA --> mergeData[merge data layer]
  mergeData --> mergeApi[merge api layer]
  laneB --> mergeApi
  mergeApi --> tests[tests on main]
  tests --> proof[merge-proof.md]`,
  runtimeRequirements: [
    "git with worktree support",
    "Python 3.11+ with FastAPI, SQLAlchemy, pytest",
    "Port 8775 free for A2 live demo API",
    "frontend npm run dev for A2WorktreeDemo",
  ],
};

const A3: TaskArchitecture = {
  taskId: "A3",
  title: "Polyglot mini-system: FastAPI, Node worker, Rust engine",
  status: "done",
  overview:
    "Standalone fraud-score pipeline: FastAPI ingress on :8780, Node worker on :8781, Rust Axum engine on :8782. Frozen HTTP contract, per-layer tests (cargo/vitest/pytest), e2e script, and A3PolyglotDemo live stack in reviewer UI.",
  flowNodes: [
    { label: "Client", sub: "POST /events", step: 1 },
    { label: "FastAPI", sub: ":8780 ingress", step: 2 },
    { label: "Node worker", sub: ":8781 orchestrator", step: 3 },
    { label: "Rust engine", sub: ":8782 scoring", step: 4 },
    { label: "Score store", sub: "in-memory", step: 5 },
    { label: "E2E proof", sub: "scripts/e2e.sh", step: 6 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Freeze HTTP contract",
      file: "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/contracts/fraud-score-contract.json",
      summary: "Ports, endpoints, request/response shapes, and scoring rule documented for all three services.",
      detail:
        "API :8780, worker :8781, engine :8782. score = min(100, (amount mod 97) + len(merchant_id)).",
    },
    {
      id: 2,
      title: "Implement Rust scoring engine",
      file: "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/engine/src/lib.rs",
      summary: "compute_score unit tests + Axum POST /score and GET /health on port 8782.",
      detail: "cargo test validates deterministic bounded scores and threshold-based reasons.",
    },
    {
      id: 3,
      title: "Implement Node worker",
      file: "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/worker/src/process.ts",
      summary: "POST /internal/process calls engine, returns transaction_id + score + reasons.",
      detail: "vitest mocks fetch for engine calls; server exposes GET /health on :8781.",
    },
    {
      id: 4,
      title: "Implement FastAPI ingress",
      file: "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/api/src/main.py",
      summary: "POST /events forwards to worker; GET /scores/{id} reads in-memory store.",
      detail: "pytest mocks httpx.post for worker; validation returns 422 on bad payloads.",
    },
    {
      id: 5,
      title: "Run end-to-end integration",
      file: "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/scripts/e2e.sh",
      summary: "Boot engine → worker → api, curl full pipeline, capture artifacts/run-proof.txt.",
      detail: "Startup order is mandatory: Rust first, then Node (needs ENGINE_URL), then FastAPI (needs WORKER_URL).",
      output: "run-proof.txt",
    },
    {
      id: 6,
      title: "Reviewer live demo",
      file: "frontend/vite-plugin-a3-fraud.ts",
      summary: "A3PolyglotDemo starts all three services, runs layer tests, and E2E smoke from browser.",
      detail: "Proxy prefix /api/a3/service maps to FastAPI :8780 after stack bootstrap.",
      output: "A3PolyglotDemo.tsx",
    },
  ],
  repoStructure: `tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/
├── contracts/fraud-score-contract.json
├── engine/          # Rust lib + Axum server (:8782)
├── worker/          # Node orchestrator (:8781)
├── api/             # FastAPI ingress (:8780)
├── scripts/e2e.sh
└── artifacts/run-proof.txt

frontend/vite-plugin-a3-fraud.ts
frontend/src/components/A3PolyglotDemo.tsx`,
  mermaidDiagram: `flowchart LR
  Client --> API[FastAPI :8780]
  API --> W[Node worker :8781]
  W --> R[Rust engine :8782]
  R --> W
  W --> API
  API --> Client`,
  runtimeRequirements: [
    "Python 3.9+ with FastAPI, httpx, pytest",
    "Node.js 18+ with tsx and vitest",
    "Rust toolchain with cargo for Axum engine",
    "Ports 8780–8782 free for live demo",
    "frontend npm run dev for A3PolyglotDemo",
  ],
};

const A4: TaskArchitecture = {
  taskId: "A4",
  title: "Repository modernization plan with executable first step",
  status: "done",
  overview:
    "Standalone legacy Flask inventory sandbox audited for modernization debt. Prioritized backlog in modernization-plan.md; first step adds pytest baseline and GET /health with 2 passing tests. A4ModernizationDemo loads plan and re-runs verification from reviewer UI.",
  flowNodes: [
    { label: "Legacy audit", sub: "legacy-sandbox/", step: 1 },
    { label: "Findings table", sub: "file:line evidence", step: 2 },
    { label: "Prioritized backlog", sub: "value/risk/effort", step: 3 },
    { label: "First step", sub: "pytest + /health", step: 4 },
    { label: "Verification", sub: "scripts/verify.sh", step: 5 },
    { label: "Live demo", sub: "A4ModernizationDemo", step: 6 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Create legacy sandbox target",
      file: "tasks/a4-repository-modernization-plan-with-executable-first-step/legacy-sandbox/app.py",
      summary: "Monolithic Flask inventory API with hardcoded secret, debug always on, no tests.",
      detail: "Embedded sandbox keeps A4 standalone — no dependency on expense-tracker or other tasks.",
    },
    {
      id: 2,
      title: "Document findings with evidence",
      file: "tasks/a4-repository-modernization-plan-with-executable-first-step/artifacts/modernization-plan.md",
      summary: "9 findings table with file:line references — secrets, debug, unpinned deps, no tests, no health.",
      detail: "Severity rated High/Medium/Low; each row cites concrete config or source location.",
      output: "modernization-plan.md",
    },
    {
      id: 3,
      title: "Prioritize modernization backlog",
      file: "tasks/a4-repository-modernization-plan-with-executable-first-step/artifacts/modernization-plan.md",
      summary: "10 ranked items by value ÷ (risk × effort); dependencies noted.",
      detail: "Rank #1 chosen: pytest harness + /health — highest value, lowest risk, unlocks CI.",
    },
    {
      id: 4,
      title: "Implement first step",
      file: "tasks/a4-repository-modernization-plan-with-executable-first-step/legacy-sandbox/tests/test_health.py",
      summary: "GET /health returns JSON; pytest + pytest-flask with conftest fixture; pinned Flask deps.",
      detail: "Additive only — no existing routes changed. 2 tests: status payload and content-type.",
      output: "first-step-diff/summary.txt",
    },
    {
      id: 5,
      title: "Run verification",
      file: "tasks/a4-repository-modernization-plan-with-executable-first-step/scripts/verify.sh",
      summary: "bash scripts/verify.sh runs pytest -v; output captured to verification-output.txt.",
      detail: "Exit code 0 required; rollback notes documented in plan for reverting first step.",
      output: "verification-output.txt",
    },
    {
      id: 6,
      title: "Reviewer live demo",
      file: "frontend/vite-plugin-a4-modernization.ts",
      summary: "A4ModernizationDemo loads plan, probes sandbox /health, POST /api/a4/verify runs pytest.",
      detail: "Vite middleware serves GET /api/a4/plan and POST /api/a4/verify from task artifacts.",
      output: "A4ModernizationDemo.tsx",
    },
  ],
  repoStructure: `tasks/a4-repository-modernization-plan-with-executable-first-step/
├── legacy-sandbox/
│   ├── app.py              # Flask inventory API (+ /health)
│   ├── requirements.txt    # pinned Flask
│   ├── requirements-dev.txt
│   └── tests/
├── scripts/verify.sh
└── artifacts/
    ├── modernization-plan.md
    ├── verification-output.txt
    └── first-step-diff/

frontend/vite-plugin-a4-modernization.ts
frontend/src/components/A4ModernizationDemo.tsx`,
  mermaidDiagram: `flowchart TD
  A[Legacy sandbox audit] --> B[Findings + evidence]
  B --> C[Prioritized backlog]
  C --> D[Implement step 1: pytest + /health]
  D --> E[verify.sh pytest proof]
  E --> F[A4ModernizationDemo]`,
  runtimeRequirements: [
    "Python 3.9+ with Flask, pytest, pytest-flask",
    "bash for scripts/verify.sh",
    "frontend npm run dev for A4ModernizationDemo",
  ],
};

const A5: TaskArchitecture = {
  taskId: "A5",
  title: "Agent code review and adversarial verification",
  status: "done",
  overview:
    "Standalone agent-generated Flask notes API PR in review-target/ with intentional defects. Adversarial review finds 14 issues (7 blocking); code-review-report.md cites file:line evidence. A5CodeReviewDemo loads report, PR file list, grep secrets, and re-runs verify.sh.",
  flowNodes: [
    { label: "Agent PR", sub: "review-target/", step: 1 },
    { label: "Static review", sub: "file:line evidence", step: 2 },
    { label: "Adversarial probes", sub: "injection, auth", step: 3 },
    { label: "Findings report", sub: "14 issues ranked", step: 4 },
    { label: "Suggested fixes", sub: "suggested-fixes/", step: 5 },
    { label: "Live demo", sub: "A5CodeReviewDemo", step: 6 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Create review sandbox PR",
      file: "tasks/a5-agent-code-review-and-adversarial-verification/review-target/app.py",
      summary: "Agent PR adds auth, search, pagination, export to Flask notes API.",
      detail: "review-base/ holds pre-PR baseline; artifacts/agent-pr.patch documents diff.",
    },
    {
      id: 2,
      title: "Static code review",
      file: "tasks/a5-agent-code-review-and-adversarial-verification/artifacts/code-review-report.md",
      summary: "14 issues across security, correctness, tests, performance, maintainability.",
      detail: "Each row includes severity, blocking flag, location, suggested fix, verification command.",
      output: "code-review-report.md",
    },
    {
      id: 3,
      title: "Adversarial verification",
      file: "tasks/a5-agent-code-review-and-adversarial-verification/scripts/verify.sh",
      summary: "pytest + SQL injection probe, pagination, 404 status, secret grep.",
      detail: "Proves agent tests pass while real bugs remain exploitable.",
      output: "verification-output.txt",
    },
    {
      id: 4,
      title: "Demonstration fixes",
      file: "tasks/a5-agent-code-review-and-adversarial-verification/suggested-fixes/db_search_and_pagination.py",
      summary: "Parameterized search and fixed pagination offset for blocking issues A5-002/A5-007.",
      detail: "test_fixes.py — 2 passing tests prove injection contained and page1=10 items.",
    },
    {
      id: 5,
      title: "Verdict and blockers",
      file: "tasks/a5-agent-code-review-and-adversarial-verification/artifacts/code-review-report.md",
      summary: "Request changes — 7 blocking issues (secret, injection, CORS, admin bypass, validation, 404, pagination).",
      detail: "Merge blocked until A5-001 through A5-007 resolved.",
    },
    {
      id: 6,
      title: "Reviewer live demo",
      file: "frontend/vite-plugin-a5-review.ts",
      summary: "A5CodeReviewDemo loads report, PR files, issue counts; POST /api/a5/verify runs adversarial checks.",
      detail: "GET /api/a5/grep scans review-target for hardcoded secrets.",
      output: "A5CodeReviewDemo.tsx",
    },
  ],
  repoStructure: `tasks/a5-agent-code-review-and-adversarial-verification/
├── review-base/            # pre-PR baseline
├── review-target/          # agent PR under review
├── suggested-fixes/
├── scripts/verify.sh
└── artifacts/
    ├── agent-pr.patch
    ├── code-review-report.md
    └── verification-output.txt

frontend/vite-plugin-a5-review.ts
frontend/src/components/A5CodeReviewDemo.tsx`,
  mermaidDiagram: `flowchart TD
  PR[Agent PR review-target] --> R[Static review]
  R --> A[Adversarial tests]
  A --> F[Findings report]
  F --> S[Suggested fixes]
  S --> D[A5CodeReviewDemo]`,
  runtimeRequirements: [
    "Python 3.9+ with Flask, pytest, pytest-flask",
    "bash + rg for scripts/verify.sh",
    "frontend npm run dev for A5CodeReviewDemo",
  ],
};

const A6: TaskArchitecture = {
  taskId: "A6",
  title: "Performance profiling and targeted improvement",
  status: "done",
  overview:
    "Standalone profile-target/ catalog store with intentional N+1 SQLite queries. cProfile identifies store.py:58 as hot path; batched JOIN fix yields ~65% improvement. A6PerformanceDemo loads performance-report.md and runs live benchmark + pytest.",
  flowNodes: [
    { label: "Baseline bench", sub: "N+1 path timing", step: 1 },
    { label: "cProfile", sub: "2001 executes", step: 2 },
    { label: "Bottleneck", sub: "per-row queries", step: 3 },
    { label: "Batched fix", sub: "single JOIN", step: 4 },
    { label: "After bench", sub: "prove ~65%", step: 5 },
    { label: "Live demo", sub: "A6PerformanceDemo", step: 6 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Seed catalog store",
      file: "tasks/a6-performance-profiling-and-targeted-improvement/profile-target/store.py",
      summary: "In-memory SQLite with 2,000 products and categories.",
      detail: "fetch_summaries_n_plus_one loops one SELECT per product — realistic ORM anti-pattern.",
    },
    {
      id: 2,
      title: "Baseline measurement",
      file: "tasks/a6-performance-profiling-and-targeted-improvement/scripts/benchmark.sh",
      summary: "5-iteration mean wall-clock via time.perf_counter on N+1 path.",
      detail: "Captured in artifacts/baseline-output.txt — ~5.4 ms mean for 2,000 products.",
      output: "baseline-output.txt",
    },
    {
      id: 3,
      title: "Profile hot path",
      file: "tasks/a6-performance-profiling-and-targeted-improvement/profile-target/benchmark.py",
      summary: "cProfile shows fetch_summaries_n_plus_one at store.py:58 with 2,001 execute calls.",
      detail: "99%+ cumulative time in conn.execute round-trips.",
      output: "baseline-output.txt",
    },
    {
      id: 4,
      title: "Targeted batched fix",
      file: "tasks/a6-performance-profiling-and-targeted-improvement/profile-target/store.py",
      summary: "fetch_summaries_batched — single JOIN query replaces N+1 loop.",
      detail: "Minimal diff; N+1 function retained for reproducible before/after comparison.",
    },
    {
      id: 5,
      title: "After measurement",
      file: "tasks/a6-performance-profiling-and-targeted-improvement/artifacts/performance-report.md",
      summary: "64.9% faster — 5.38 ms → 1.89 ms mean, 1 SQL execute vs 2,001.",
      detail: "Same methodology as baseline; numbers in before/after comparison table.",
      output: "performance-report.md",
    },
    {
      id: 6,
      title: "Reviewer live demo",
      file: "frontend/vite-plugin-a6-performance.ts",
      summary: "A6PerformanceDemo loads report; POST /api/a6/run-benchmark and /api/a6/run-tests.",
      detail: "Shows baseline/after ms, improvement %, and pytest pass count.",
      output: "A6PerformanceDemo.tsx",
    },
  ],
  repoStructure: `tasks/a6-performance-profiling-and-targeted-improvement/
├── profile-target/
│   ├── store.py
│   ├── benchmark.py
│   └── tests/
├── scripts/benchmark.sh
└── artifacts/
    ├── performance-report.md
    ├── baseline-output.txt
    └── after-output.txt

frontend/vite-plugin-a6-performance.ts
frontend/src/components/A6PerformanceDemo.tsx`,
  mermaidDiagram: `flowchart TD
  B[Baseline N+1 bench] --> P[cProfile hot path]
  P --> F[Batched JOIN fix]
  F --> A[After bench]
  A --> T[pytest behavior check]
  T --> D[A6PerformanceDemo]`,
  runtimeRequirements: [
    "Python 3.9+ with pytest",
    "bash for scripts/benchmark.sh",
    "frontend npm run dev for A6PerformanceDemo",
  ],
};

const D1: TaskArchitecture = {
  taskId: "D1",
  title: "Terraform plan for a small service",
  status: "done",
  overview:
    "Terraform for S3 + Lambda + API Gateway upload stack planned against LocalStack (localhost:4566). scripts/verify.sh runs init/validate/plan; D1TerraformDemo loads artifacts and re-runs verify from the reviewer UI.",
  flowNodes: [
    { label: "LocalStack", sub: "docker-compose", step: 1 },
    { label: "terraform init", sub: "AWS provider", step: 2 },
    { label: "terraform validate", sub: "syntax", step: 3 },
    { label: "terraform plan", sub: "S3+Lambda+APIGW", step: 4 },
    { label: "Reviewer UI", sub: "D1TerraformDemo", step: 5 },
  ],
  flowSteps: [
    {
      id: 1,
      title: "Start LocalStack emulator",
      file: "tasks/d1-terraform-plan-for-a-small-service/docker-compose.yml",
      summary: "LocalStack 3 exposes S3, Lambda, API Gateway, IAM, and STS on port 4566.",
      detail:
        "verify.sh starts compose when Docker is available; plan still runs with LocalStack endpoint config if the emulator is unreachable.",
    },
    {
      id: 2,
      title: "Define AWS resources in Terraform",
      file: "tasks/d1-terraform-plan-for-a-small-service/terraform/main.tf",
      summary:
        "Versioned S3 bucket, Python Lambda (handler.py zip), IAM role/policy, API Gateway POST /upload with AWS_PROXY integration.",
      detail: "archive_file builds lambda.zip into artifacts/ during plan.",
    },
    {
      id: 3,
      title: "Point provider at LocalStack",
      file: "tasks/d1-terraform-plan-for-a-small-service/terraform/providers.tf",
      summary: "use_localstack=true sets dummy credentials and service endpoints at 127.0.0.1:4566.",
      detail: "No real AWS account required for validate/plan with default variables.",
    },
    {
      id: 4,
      title: "One-command verify script",
      file: "tasks/d1-terraform-plan-for-a-small-service/scripts/verify.sh",
      summary: "Runs terraform init, validate, and plan; captures output to artifacts/.",
      output: "terraform-validate.txt + terraform-plan.txt",
    },
    {
      id: 5,
      title: "Reviewer UI",
      file: "frontend/vite-plugin-d1-terraform.ts → POST /api/d1/verify",
      summary: "D1TerraformDemo displays saved artifacts and re-runs verify.sh on demand.",
      output: "Live validate/plan output in browser",
    },
  ],
  repoStructure: `tasks/d1-terraform-plan-for-a-small-service/
├── docker-compose.yml          # LocalStack
├── lambda/handler.py
├── scripts/verify.sh
├── terraform/
│   ├── main.tf                 # S3, Lambda, API Gateway, IAM
│   ├── providers.tf            # LocalStack endpoints
│   ├── variables.tf
│   └── outputs.tf
└── artifacts/
    ├── terraform-validate.txt
    └── terraform-plan.txt

frontend/vite-plugin-d1-terraform.ts
frontend/src/components/D1TerraformDemo.tsx`,
  mermaidDiagram: `flowchart TD
  DC[docker-compose LocalStack] --> TF[Terraform config]
  TF --> I[terraform init]
  I --> V[terraform validate]
  V --> P[terraform plan]
  P --> S3[S3 bucket]
  P --> L[Lambda handler]
  P --> APIGW[API Gateway /upload]
  P --> A[artifacts/*.txt]
  UI[D1TerraformDemo] --> API[POST /api/d1/verify]
  API --> VS[verify.sh]`,
  runtimeRequirements: [
    "Terraform ≥ 1.5",
    "Docker for LocalStack (optional but recommended)",
    "frontend npm run dev for D1TerraformDemo",
  ],
};

export const TASK_ARCHITECTURES: Record<string, TaskArchitecture> = {
  B1,
  B2,
  B3,
  B4,
  B5,
  B6,
  I1,
  I2,
  I3,
  I4,
  I5,
  I6,
  A1,
  A2,
  A3,
  A4,
  A5,
  A6,
  D1,
  D2: {
    taskId: "D2",
    title: "docker-compose stack with end-to-end tests",
    status: "done",
    overview:
      "Three-service job queue: FastAPI API, Postgres 16, and a Python worker. Seed SQL loads on first boot; scripts/e2e.sh tears down volumes, rebuilds, runs pytest, and captures inter-service logs.",
    flowNodes: [
      { label: "Postgres", sub: "seed SQL", step: 1 },
      { label: "FastAPI API", sub: "POST/GET jobs", step: 2 },
      { label: "Worker", sub: "poll + update", step: 3 },
      { label: "pytest E2E", sub: "one command", step: 4 },
      { label: "Reviewer UI", sub: "D2DockerDemo", step: 5 },
    ],
    flowSteps: [
      {
        id: 1,
        title: "Database schema and seed",
        file: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/db/init/",
        summary: "001_schema.sql creates jobs table; 002_seed.sql inserts three pending jobs.",
        detail: "Mounted into postgres docker-entrypoint-initdb.d — runs only on empty volume.",
      },
      {
        id: 2,
        title: "API service",
        file: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api/",
        summary: "FastAPI on :8090 — health, list/create/get jobs; structured job_created logs.",
        detail: "Dockerfile with HEALTHCHECK; depends_on db healthy.",
      },
      {
        id: 3,
        title: "Worker service",
        file: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/worker/",
        summary: "Polls pending jobs with FOR UPDATE SKIP LOCKED; job_picked / job_completed logs.",
        detail: "Simulates work with short sleep; marks jobs done in Postgres.",
      },
      {
        id: 4,
        title: "One-command E2E",
        file: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/scripts/e2e.sh",
        summary: "teardown -v → compose up --build → pytest → capture service logs.",
        output: "artifacts/e2e-output.txt + artifacts/service-logs.txt",
      },
      {
        id: 5,
        title: "Reviewer UI",
        file: "frontend/vite-plugin-d2-docker.ts → POST /api/d2/e2e",
        summary: "D2DockerDemo loads artifacts and re-runs e2e.sh on demand.",
        output: "Live E2E output in browser",
      },
    ],
    repoStructure: `tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/
├── docker-compose.yml
├── api/Dockerfile + src/main.py
├── worker/Dockerfile + src/worker.py
├── db/init/001_schema.sql + 002_seed.sql
├── e2e/test_stack.py
├── scripts/e2e.sh + teardown.sh
└── artifacts/
    ├── e2e-output.txt
    └── service-logs.txt

frontend/vite-plugin-d2-docker.ts
frontend/src/components/D2DockerDemo.tsx`,
    mermaidDiagram: `flowchart LR
  E2E[pytest E2E] -->|POST_GET| API[FastAPI_api]
  API -->|INSERT_SELECT| DB[(Postgres)]
  Worker[Python_worker] -->|POLL_UPDATE| DB
  Seed[seed_sql] -->|INSERT| DB
  UI[D2DockerDemo] -->|POST| VS[e2e.sh]`,
    runtimeRequirements: [
      "Docker + docker-compose (or docker compose plugin)",
      "Python 3.11+ for e2e venv (installed by e2e.sh)",
      "frontend npm run dev for D2DockerDemo",
    ],
  },
  D3: planned(
    "D3",
    "CI pipeline that lints, tests, and builds an image",
    "GitHub Actions or GitLab CI pipeline with lint, test, and container build stages.",
    [
      { label: "Lint job", sub: "static analysis", step: 1 },
      { label: "Test job", sub: "unit tests", step: 2 },
      { label: "Build job", sub: "Docker image", step: 3 },
    ],
    [
      {
        title: "Pipeline as code",
        file: "tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image/.github/workflows/",
        summary: "Fail fast on lint; test before build; push or save image artifact.",
        detail: "Include sample successful run log in artifacts.",
      },
    ],
    `tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image/
├── .github/workflows/ci.yml
└── artifacts/ci-run-log.txt`,
    `flowchart LR
  PR[Push/PR] --> L[Lint]
  L --> T[Test]
  T --> B[Build image]`,
    ["GitHub Actions or GitLab CI", "docker for image build job"],
  ),
  D4: planned(
    "D4",
    "Kubernetes manifests verified on a local cluster",
    "Deployment, Service, ConfigMap manifests verified on kind or minikube with curl proof.",
    [
      { label: "Manifests", sub: "Deploy/Svc/CM", step: 1 },
      { label: "Local cluster", sub: "kind/minikube", step: 2 },
      { label: "Apply + curl", sub: "proof", step: 3 },
    ],
    [
      {
        title: "Apply and verify",
        file: "tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/k8s/",
        summary: "kubectl apply and curl against Service endpoint.",
        detail: "Capture pod status and HTTP response in artifacts.",
      },
    ],
    `tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/
├── k8s/
└── artifacts/verify-output.txt`,
    `flowchart TD
  M[Manifests] --> K[kind/minikube]
  K --> A[kubectl apply]
  A --> C[curl proof]`,
    ["kubectl", "kind or minikube"],
  ),
  D5: planned(
    "D5",
    "Reproducible dev environment from a fresh clone",
    "Single-command bootstrap (devcontainer, Nix, or Makefile) that installs deps and passes tests from a fresh clone.",
    [
      { label: "Bootstrap script", sub: "one command", step: 1 },
      { label: "Deps install", sub: "locked versions", step: 2 },
      { label: "Test proof", sub: "green suite", step: 3 },
    ],
    [
      {
        title: "Document fresh-clone workflow",
        file: "tasks/d5-reproducible-dev-environment-from-a-fresh-clone/",
        summary: "make bootstrap or devcontainer up → npm test / pytest passes.",
        detail: "Record terminal output from a clean machine or container.",
      },
    ],
    `tasks/d5-reproducible-dev-environment-from-a-fresh-clone/
├── Makefile or .devcontainer/
└── artifacts/bootstrap-log.txt`,
    `flowchart TD
  CL[git clone] --> B[bootstrap command]
  B --> I[install deps]
  I --> T[tests pass]`,
    ["docker optional for devcontainer", "Clean environment for proof"],
  ),
  D6: planned(
    "D6",
    "Observability bolt-on with metrics and a dashboard",
    "Add structured logging, /metrics endpoint, Prometheus scrape config, and Grafana dashboard.",
    [
      { label: "Structured logs", sub: "JSON/logger", step: 1 },
      { label: "/metrics", sub: "Prometheus", step: 2 },
      { label: "Dashboard", sub: "Grafana JSON", step: 3 },
    ],
    [
      {
        title: "Instrument service",
        file: "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/",
        summary: "Request counters, latency histograms, and correlation IDs in logs.",
        detail: "Prometheus scrapes /metrics; Grafana dashboard imported from JSON.",
      },
    ],
    `tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/
├── prometheus/
├── grafana/
└── artifacts/dashboard-screenshot.md`,
    `flowchart LR
  SVC[Service] -->|logs| L[Logger]
  SVC -->|/metrics| P[Prometheus]
  P --> G[Grafana]`,
    ["docker-compose for Prometheus + Grafana", "Target service from prior task"],
  ),
};

export const EVAL_REPO_ARCHITECTURE = {
  overview:
    "This repository is an evaluation workspace: a React reviewer dashboard (frontend/) plus one folder per task under tasks/. Each task owns its own src/, artifacts/, and README. The dashboard reads tasks.json and serves task READMEs and artifacts during local dev.",
  mermaidDiagram: `flowchart TD
  subgraph Reviewer["Reviewer dashboard (frontend/)"]
    UI[React SPA\\nTaskList / TaskDetail]
    Vite[Vite dev server]
    UI --> Vite
  end
  subgraph Tasks["tasks/ — one folder per eval item"]
    B1T[b1-repo-artifact-inventory]
    B2T[b2-api-endpoint-map]
    MORE[... B3–D6]
  end
  Vite -->|GET /tasks.json| UI
  Vite -->|GET /tasks/* /docs/*| Tasks
  Vite -->|POST /api/b1/scan| B1T
  Vite -->|POST /api/b3/run-tests| B3T[b3-test-discovery]
  Vite -->|/api/b4/service/*| B4T[b4-fastapi-service]
  Vite -->|/api/b5/service/*| B5T[b5-node-api]
  Vite -->|POST /api/b6/run-*| B6T[b6-rust-greenfield]
  UI -->|navigate| HIW[How it works\\nper-task architecture]`,
  repoStructure: `pratik_ai_eval/
├── docs/                    # eval source PDF
├── frontend/                # reviewer React app
│   ├── public/tasks.json    # task manifest (status, paths)
│   ├── src/pages/           # TaskList, TaskDetail, HowItWorks
│   └── vite.config.ts       # artifact serving + B1 API plugin
└── tasks/
    ├── b1-repo-artifact-inventory/
    ├── b2-api-endpoint-map/
    └── ...                  # one README + artifacts per task`,
};

export function getTaskArchitecture(taskId: string): TaskArchitecture | undefined {
  return TASK_ARCHITECTURES[taskId.toUpperCase()];
}

export function listTaskArchitectureIds(): string[] {
  return Object.keys(TASK_ARCHITECTURES).sort();
}
