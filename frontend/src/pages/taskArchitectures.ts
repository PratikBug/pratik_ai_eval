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

export const TASK_ARCHITECTURES: Record<string, TaskArchitecture> = {
  B1,
  B2,
  B3,
  B4: planned(
    "B4",
    "FastAPI greenfield service",
    "Greenfield Python FastAPI service exposing transaction and balance endpoints with input validation, persistence, and at least three automated tests.",
    [
      { label: "FastAPI app", sub: "main.py + routes", step: 1 },
      { label: "Validation", sub: "Pydantic models", step: 2 },
      { label: "Storage", sub: "in-memory or DB", step: 3 },
      { label: "Tests", sub: "pytest + httpx", step: 4 },
    ],
    [
      {
        title: "Define API contract",
        file: "tasks/b4-fastapi-greenfield-service/src/",
        summary: "POST/GET /transactions, GET /balance with validated request/response bodies.",
        detail: "Use Pydantic models for input validation and consistent error responses.",
      },
      {
        title: "Implement service layer",
        file: "tasks/b4-fastapi-greenfield-service/src/",
        summary: "Business logic separated from route handlers.",
        detail: "Track transactions and compute running balance.",
      },
      {
        title: "Write and run tests",
        file: "tasks/b4-fastapi-greenfield-service/tests/",
        summary: "At least three tests covering happy path and validation errors.",
        detail: "Use TestClient or httpx against the FastAPI app.",
        output: "pytest results in README",
      },
    ],
    `tasks/b4-fastapi-greenfield-service/
├── src/           # FastAPI application
├── tests/         # pytest suite
└── README.md      # install, run, test commands`,
    `flowchart LR
  C[Client] -->|HTTP| A[FastAPI routes]
  A --> B[Pydantic validation]
  B --> D[Service layer]
  D --> E[(Storage)]
  T[pytest] -->|TestClient| A`,
    ["python3", "pip install -r requirements.txt", "uvicorn to run the service"],
  ),
  B5: planned(
    "B5",
    "Node.js greenfield API or CLI",
    "Same transaction/balance domain as B4, implemented in Node.js as either an Express API or a CLI tool with tests and README.",
    [
      { label: "Node entry", sub: "index.ts or cli.ts", step: 1 },
      { label: "Routes / commands", sub: "HTTP or argv", step: 2 },
      { label: "Validation", sub: "zod or joi", step: 3 },
      { label: "Tests", sub: "vitest or jest", step: 4 },
    ],
    [
      {
        title: "Choose API or CLI shape",
        file: "tasks/b5-nodejs-greenfield-api-or-cli/src/",
        summary: "Mirror B4 endpoints as REST routes or equivalent CLI subcommands.",
        detail: "Document the chosen interface in README with example curl or CLI invocations.",
      },
      {
        title: "Implement core logic",
        file: "tasks/b5-nodejs-greenfield-api-or-cli/src/",
        summary: "Transaction recording and balance computation.",
        detail: "Share validation rules conceptually with B4 for reviewer comparison.",
      },
    ],
    `tasks/b5-nodejs-greenfield-api-or-cli/
├── src/
├── tests/
└── README.md`,
    `flowchart TD
  A[CLI or Express] --> B[Validation layer]
  B --> C[Transaction store]
  D[Tests] --> A`,
    ["node >= 18", "npm install"],
  ),
  B6: planned(
    "B6",
    "Rust greenfield",
    "Rust CLI that parses log files and counts INFO, WARN, and ERROR lines with unit tests.",
    [
      { label: "CLI args", sub: "clap", step: 1 },
      { label: "Log parser", sub: "line scanner", step: 2 },
      { label: "Counters", sub: "INFO/WARN/ERROR", step: 3 },
      { label: "Tests", sub: "cargo test", step: 4 },
    ],
    [
      {
        title: "Parse log file path from argv",
        file: "tasks/b6-rust-greenfield/src/main.rs",
        summary: "Accept a file path and stream lines without loading entire file into memory.",
        detail: "Use clap for argument parsing and clear usage text.",
      },
      {
        title: "Count severity levels",
        file: "tasks/b6-rust-greenfield/src/",
        summary: "Regex or prefix match for INFO, WARN, ERROR per line.",
        detail: "Print summary counts to stdout in a stable format for scripting.",
        output: "count summary on stdout",
      },
    ],
    `tasks/b6-rust-greenfield/
├── src/
├── tests/ or #[cfg(test)]
└── README.md`,
    `flowchart LR
  A[CLI args] --> B[Read log file]
  B --> C[Line classifier]
  C --> D[Print counts]`,
    ["rust toolchain", "cargo build && cargo test"],
  ),
  I1: planned(
    "I1",
    "ER diagram from repo",
    "Reverse-engineer entity relationships from ORM models, migrations, and schema files with cited source references.",
    [
      { label: "Schema sources", sub: "models + migrations", step: 1 },
      { label: "Entity extract", sub: "tables + fields", step: 2 },
      { label: "Relationship map", sub: "FK + joins", step: 3 },
      { label: "ER diagram", sub: "Mermaid or PNG", step: 4 },
    ],
    [
      {
        title: "Find schema definition files",
        file: "target repo — models/, migrations/",
        summary: "Locate JPA entities, SQLAlchemy models, Prisma schema, Flyway scripts, etc.",
        detail: "Every entity in the diagram must cite a source file path.",
      },
      {
        title: "Render ER diagram",
        file: "tasks/i1-er-diagram-from-repo/artifacts/",
        summary: "Mermaid or exported diagram with entities, attributes, and cardinalities.",
        detail: "Mark uncertain relationships with notes for manual verification.",
        output: "er-diagram.mmd or .png",
      },
    ],
    `tasks/i1-er-diagram-from-repo/
└── artifacts/
    ├── er-diagram.mmd
    └── er-diagram-report.md`,
    `flowchart TD
  A[ORM models\\nmigrations] --> B[Entity extractor]
  B --> C[Relationship graph]
  C --> D[ER diagram\\nwith citations]`,
    ["Access to target repository source", "Optional: mermaid-cli to export PNG"],
  ),
  I2: planned(
    "I2",
    "End-to-end flow trace",
    "Trace one endpoint, event, or cron job from entry point through services to database, queue, or external API side effects.",
    [
      { label: "Entry point", sub: "controller/handler", step: 1 },
      { label: "Service chain", sub: "business logic", step: 2 },
      { label: "Side effects", sub: "DB/queue/API", step: 3 },
      { label: "Sequence diagram", sub: "Mermaid", step: 4 },
    ],
    [
      {
        title: "Pick a trace target",
        file: "target repo",
        summary: "One HTTP endpoint, message consumer, or scheduled job.",
        detail: "Document why this flow was chosen and what business operation it represents.",
      },
      {
        title: "Build sequence diagram",
        file: "tasks/i2-end-to-end-flow-trace/artifacts/sequence-diagram.mmd",
        summary: "Participants, calls, and async boundaries from entry to side effect.",
        detail: "Mark [NEEDS CLARIFICATION] where code paths branch or are ambiguous.",
        output: "flow-trace.md + sequence-diagram.mmd",
      },
    ],
    `tasks/i2-end-to-end-flow-trace/
└── artifacts/
    ├── flow-trace.md
    └── sequence-diagram.mmd`,
    `sequenceDiagram
  Client->>Controller: HTTP request
  Controller->>Service: business call
  Service->>Repository: persist
  Repository->>DB: SQL`,
    ["Target repository checkout", "Static analysis + manual code reading"],
  ),
  I3: planned(
    "I3",
    "Small safe change in unfamiliar repo",
    "Make a minimal, tested change in an unfamiliar codebase with explicit risk assessment and rollback notes.",
    [
      { label: "Understand context", sub: "read + trace", step: 1 },
      { label: "Minimal diff", sub: "single concern", step: 2 },
      { label: "Test update", sub: "prove behavior", step: 3 },
      { label: "Risk note", sub: "blast radius", step: 4 },
    ],
    [
      {
        title: "Scope the change",
        file: "target repo",
        summary: "One bug fix or small enhancement with clear acceptance criteria.",
        detail: "Avoid drive-by refactors; document files touched and why.",
      },
      {
        title: "Verify with existing tests",
        file: "target repo tests/",
        summary: "Run affected test suite; add or update tests for the change.",
        detail: "Include risk assessment: what could break in production.",
      },
    ],
    `tasks/i3-small-safe-change-in-unfamiliar-repo/
└── artifacts/
    ├── change-summary.md
    └── risk-assessment.md`,
    `flowchart TD
  A[Read unfamiliar repo] --> B[Identify minimal fix]
  B --> C[Implement + test]
  C --> D[Risk assessment\\n+ rollback plan]`,
    ["Target repo clone", "Project test runner"],
  ),
  I4: planned(
    "I4",
    "Polyglot service pair: FastAPI plus Node client",
    "FastAPI /convert endpoint with a Node.js CLI client, shared contract, tests on both sides, and README run order.",
    [
      { label: "FastAPI service", sub: "POST /convert", step: 1 },
      { label: "Node CLI client", sub: "calls API", step: 2 },
      { label: "Contract tests", sub: "both sides", step: 3 },
    ],
    [
      {
        title: "Define /convert contract",
        file: "tasks/i4-polyglot-service-pair-fastapi-plus-node-client/",
        summary: "Request/response JSON schema shared between Python service and Node client.",
        detail: "Document base URL, error codes, and example payloads in README.",
      },
      {
        title: "Wire client to service",
        file: "Node CLI → FastAPI",
        summary: "CLI accepts input, POSTs to running FastAPI, prints result.",
        detail: "README documents start order: launch API first, then run CLI.",
      },
    ],
    `tasks/i4-polyglot-service-pair-fastapi-plus-node-client/
├── api/           # FastAPI service
├── client/        # Node.js CLI
└── README.md`,
    `flowchart LR
  CLI[Node CLI] -->|POST /convert| API[FastAPI]
  API --> R[Response JSON]
  R --> CLI`,
    ["python3 + node", "Both services run locally; document ports"],
  ),
  I5: planned(
    "I5",
    "Dockerize and run",
    "Containerize a service with Dockerfile, build proof, health check, and documented run commands.",
    [
      { label: "Dockerfile", sub: "multi-stage", step: 1 },
      { label: "docker build", sub: "image proof", step: 2 },
      { label: "docker run", sub: "health check", step: 3 },
    ],
    [
      {
        title: "Write production-oriented Dockerfile",
        file: "tasks/i5-dockerize-and-run/Dockerfile",
        summary: "Minimal image with non-root user where practical.",
        detail: "Include HEALTHCHECK or document curl proof against /health.",
      },
    ],
    `tasks/i5-dockerize-and-run/
├── Dockerfile
├── artifacts/build-log.txt
└── README.md`,
    `flowchart TD
  A[Source] --> B[docker build]
  B --> C[Image]
  C --> D[docker run]
  D --> E[Health check proof]`,
    ["docker installed", "Service source from prior task or sample app"],
  ),
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
