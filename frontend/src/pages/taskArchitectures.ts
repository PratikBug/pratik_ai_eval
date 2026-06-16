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
  I6: planned(
    "I6",
    "Bug diagnosis with agent",
    "Reproduce a seeded bug, identify root cause, implement fix, and verify with tests.",
    [
      { label: "Reproduce", sub: "failing scenario", step: 1 },
      { label: "Root cause", sub: "trace + hypothesis", step: 2 },
      { label: "Fix", sub: "minimal patch", step: 3 },
      { label: "Verify", sub: "tests green", step: 4 },
    ],
    [
      {
        title: "Document reproduction steps",
        file: "tasks/i6-bug-diagnosis-with-agent/artifacts/",
        summary: "Exact commands and inputs that trigger the bug.",
        detail: "Capture before/after behavior and stack traces.",
      },
    ],
    `tasks/i6-bug-diagnosis-with-agent/
└── artifacts/
    ├── bug-report.md
    └── fix-verification.txt`,
    `flowchart TD
  A[Seeded bug] --> B[Reproduce]
  B --> C[Root cause analysis]
  C --> D[Fix + tests]
  D --> E[Verification proof]`,
    ["Buggy sample repo or branch", "Test runner"],
  ),
  A1: planned(
    "A1",
    "Multi-worktree parallel plan",
    "Split a large task into parallel git worktrees with merge order, conflict strategy, and verification plan.",
    [
      { label: "Task decomposition", sub: "independent slices", step: 1 },
      { label: "Worktree map", sub: "branch per slice", step: 2 },
      { label: "Merge plan", sub: "order + verify", step: 3 },
    ],
    [
      {
        title: "Identify parallelizable work",
        file: "tasks/a1-multi-worktree-parallel-plan/artifacts/plan.md",
        summary: "Split by module or feature with minimal cross-worktree dependencies.",
        detail: "Document git worktree commands and merge/rebase strategy.",
      },
    ],
    `tasks/a1-multi-worktree-parallel-plan/
└── artifacts/
    └── parallel-plan.md`,
    `flowchart TD
  T[Large task] --> W1[Worktree A]
  T --> W2[Worktree B]
  W1 --> M[Merge + verify]
  W2 --> M`,
    ["git worktree support", "Clean main branch checkout"],
  ),
  A2: planned(
    "A2",
    "Execute two parallel worktrees",
    "Create two worktrees, implement independent changes in each, and reconcile into a clean merge.",
    [
      { label: "worktree A", sub: "feature slice 1", step: 1 },
      { label: "worktree B", sub: "feature slice 2", step: 2 },
      { label: "Merge", sub: "conflict resolve", step: 3 },
    ],
    [
      {
        title: "Execute plan from A1",
        file: "two git worktrees",
        summary: "Independent commits in each worktree with passing tests per slice.",
        detail: "Final merge on main/stage with combined test run.",
      },
    ],
    `tasks/a2-execute-two-parallel-worktrees/
└── artifacts/
    └── merge-proof.md`,
    `flowchart LR
  M[main] --> A[worktree A]
  M --> B[worktree B]
  A --> MERGE[Reconcile]
  B --> MERGE`,
    ["git", "Two terminal sessions or agents"],
  ),
  A3: planned(
    "A3",
    "Polyglot mini-system: FastAPI, Node worker, Rust engine",
    "Mini fraud-score pipeline: Python API, Node.js worker, Rust scoring engine, with integration tests and documented run order.",
    [
      { label: "FastAPI gateway", sub: "HTTP ingress", step: 1 },
      { label: "Node worker", sub: "queue/async", step: 2 },
      { label: "Rust engine", sub: "score compute", step: 3 },
      { label: "Integration tests", sub: "E2E proof", step: 4 },
    ],
    [
      {
        title: "Define service boundaries",
        file: "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/",
        summary: "API accepts events; worker orchestrates; Rust engine computes fraud score.",
        detail: "Document IPC (HTTP, gRPC, or stdin/stdout) and startup order.",
      },
    ],
    `tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine/
├── api/       # FastAPI
├── worker/    # Node.js
├── engine/    # Rust
└── README.md`,
    `flowchart LR
  Client --> API[FastAPI]
  API --> W[Node worker]
  W --> R[Rust engine]
  R --> W
  W --> API`,
    ["python3", "node", "rust/cargo", "docker-compose optional"],
  ),
  A4: planned(
    "A4",
    "Repository modernization plan with executable first step",
    "Analyze a legacy repo, prioritize modernization items, and implement the highest-value first step.",
    [
      { label: "Repo audit", sub: "deps + patterns", step: 1 },
      { label: "Prioritized plan", sub: "ranked items", step: 2 },
      { label: "First step", sub: "executable diff", step: 3 },
    ],
    [
      {
        title: "Produce modernization backlog",
        file: "tasks/a4-repository-modernization-plan-with-executable-first-step/artifacts/plan.md",
        summary: "Rank by risk reduction, effort, and dependency order.",
        detail: "First step must be a merged-quality change with tests.",
      },
    ],
    `tasks/a4-repository-modernization-plan-with-executable-first-step/
└── artifacts/
    ├── modernization-plan.md
    └── first-step-diff/`,
    `flowchart TD
  A[Legacy repo audit] --> B[Prioritized backlog]
  B --> C[Implement step 1]
  C --> D[Tests + proof]`,
    ["Target repo access", "Test suite for verification"],
  ),
  A5: planned(
    "A5",
    "Agent code review and adversarial verification",
    "Review an agent-generated PR for correctness, security, tests, performance, and maintainability.",
    [
      { label: "PR diff review", sub: "scope + intent", step: 1 },
      { label: "Adversarial checks", sub: "edge cases", step: 2 },
      { label: "Findings report", sub: "severity ranked", step: 3 },
    ],
    [
      {
        title: "Structured review checklist",
        file: "tasks/a5-agent-code-review-and-adversarial-verification/artifacts/review.md",
        summary: "Correctness, security, test coverage, performance, maintainability.",
        detail: "Include concrete file:line references and suggested fixes.",
      },
    ],
    `tasks/a5-agent-code-review-and-adversarial-verification/
└── artifacts/
    └── code-review-report.md`,
    `flowchart TD
  PR[Agent PR] --> R[Static review]
  R --> A[Adversarial tests]
  A --> F[Findings report]`,
    ["PR branch or patch file", "Ability to run tests locally"],
  ),
  A6: planned(
    "A6",
    "Performance profiling and targeted improvement",
    "Profile a hot path, identify bottleneck, make a minimal measurable improvement with before/after numbers.",
    [
      { label: "Baseline measure", sub: "profile/bench", step: 1 },
      { label: "Bottleneck", sub: "flamegraph or timing", step: 2 },
      { label: "Targeted fix", sub: "minimal change", step: 3 },
      { label: "After measure", sub: "prove improvement", step: 4 },
    ],
    [
      {
        title: "Capture before/after metrics",
        file: "tasks/a6-performance-profiling-and-targeted-improvement/artifacts/",
        summary: "Latency, throughput, or CPU numbers with methodology documented.",
        detail: "Improvement must trace to a specific code change, not hardware variance.",
      },
    ],
    `tasks/a6-performance-profiling-and-targeted-improvement/
└── artifacts/
    ├── profile-report.md
    └── before-after.md`,
    `flowchart TD
  A[Baseline benchmark] --> B[Profile hot path]
  B --> C[Targeted optimization]
  C --> D[After benchmark]`,
    ["Profiler for target language", "Reproducible benchmark script"],
  ),
  D1: planned(
    "D1",
    "Terraform plan for a small service",
    "Terraform modules that validate and produce a clean plan for a small cloud deployment.",
    [
      { label: "terraform init", sub: "providers", step: 1 },
      { label: "terraform validate", sub: "syntax", step: 2 },
      { label: "terraform plan", sub: "clean output", step: 3 },
    ],
    [
      {
        title: "Define infrastructure modules",
        file: "tasks/d1-terraform-plan-for-a-small-service/",
        summary: "VPC, compute, and supporting resources for one service.",
        detail: "Plan output saved as artifact; no apply required for eval.",
      },
    ],
    `tasks/d1-terraform-plan-for-a-small-service/
├── main.tf
├── variables.tf
└── artifacts/terraform-plan.txt`,
    `flowchart TD
  TF[Terraform config] --> V[terraform validate]
  V --> P[terraform plan]
  P --> O[plan artifact]`,
    ["terraform CLI", "Provider credentials optional for plan-only"],
  ),
  D2: planned(
    "D2",
    "docker-compose stack with end-to-end tests",
    "Multi-service docker-compose stack with seed data and one-command E2E test run.",
    [
      { label: "compose.yml", sub: "multi-service", step: 1 },
      { label: "Seed data", sub: "fixtures", step: 2 },
      { label: "E2E tests", sub: "one command", step: 3 },
    ],
    [
      {
        title: "Orchestrate services",
        file: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/docker-compose.yml",
        summary: "App + database + dependencies with health checks.",
        detail: "Single command brings stack up and runs E2E suite.",
      },
    ],
    `tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/
├── docker-compose.yml
├── e2e/
└── artifacts/e2e-output.txt`,
    `flowchart TD
  DC[docker compose up] --> S1[Service A]
  DC --> S2[Service B]
  E2E[E2E tests] --> S1
  E2E --> S2`,
    ["docker + docker compose", "curl or test runner for E2E"],
  ),
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
