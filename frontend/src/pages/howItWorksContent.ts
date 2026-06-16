export interface FlowStep {
  id: number;
  title: string;
  file: string;
  summary: string;
  detail: string;
  output?: string;
}

export const B1_FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: "Reviewer pastes a Bitbucket URL",
    file: "frontend/src/components/B1InventoryDemo.tsx",
    summary: "The B1 task page collects a Bitbucket web or git URL and optional branch override.",
    detail:
      "The reviewer opens task B1, clicks Use example URL or pastes a link such as " +
      "https://bitbucket.org/ramram43210/java_spring_2019/src/master/. " +
      "Client-side validation ensures the URL is a Bitbucket repository before any network call.",
  },
  {
    id: 2,
    title: "Browser calls the scan API",
    file: "frontend/vite-plugin-b1-scan.ts → POST /api/b1/scan",
    summary: "The UI sends JSON { repoUrl, branch? } to the Vite dev-server middleware.",
    detail:
      "fetch('/api/b1/scan') runs only while npm run dev (or preview) is active. " +
      "The plugin validates the URL again, then orchestrates the Python scanner on the host machine.",
  },
  {
    id: 3,
    title: "Repository is cloned with git",
    file: "tasks/b1-repo-artifact-inventory/src/repo_source.py",
    summary: "Bitbucket web URLs are normalized to a git clone URL; branch is parsed from /src/branch/ paths.",
    detail:
      "repo_source.py runs git clone --depth 1 into a temporary directory. " +
      "Public repos clone without credentials. Private repos require SSH or HTTPS app password configured locally.",
    output: "Temporary clone directory under the system temp folder",
  },
  {
    id: 4,
    title: "Source files are scanned and classified",
    file: "tasks/b1-repo-artifact-inventory/src/inventory_scanner.py",
    summary: "The scanner walks the tree, skipping vendor/build dirs, and classifies artifacts by language.",
    detail:
      "Python uses AST for classes/functions. Java/Kotlin, TypeScript, Go, and Rust use regex patterns. " +
      "Naming heuristics detect *Service, *Controller, *Repository, configs, utilities, jobs, and consumers. " +
      "Each hit records file path and line number.",
    output: "inventory.json with categorized artifact lists",
  },
  {
    id: 5,
    title: "Markdown report is rendered",
    file: "tasks/b1-repo-artifact-inventory/src/render_report.py",
    summary: "Structured JSON is converted into a reviewer-friendly Markdown report.",
    detail:
      "render_report.py writes a summary table plus sections for classes, interfaces, services, controllers, " +
      "models, repositories, jobs, consumers, configs, and utilities. Items inferred from filenames are marked.",
    output: "*-inventory-report.md",
  },
  {
    id: 6,
    title: "Results return to the reviewer UI",
    file: "frontend/src/components/B1InventoryDemo.tsx",
    summary: "The API responds with inventory, summary counts, and the Markdown report text.",
    detail:
      "The UI shows source URL, branch, files scanned, a category summary grid, and the full report preview. " +
      "The temporary clone is deleted unless --keep-clone is used in CLI mode.",
    output: "Live inventory visible in the browser",
  },
];

export const B1_REPO_STRUCTURE = `pratik_ai_eval/
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
    └── artifacts/                           # saved scan outputs (CLI)`;

export const B1_MERMAID_DIAGRAM = `flowchart TD
  A[Reviewer UI\\nB1InventoryDemo] -->|POST /api/b1/scan| B[Vite middleware\\nvite-plugin-b1-scan]
  B -->|spawn python3| C[scan_repo.py]
  C --> D[repo_source.py\\ngit clone]
  D --> E[inventory_scanner.py\\nwalk + classify]
  E --> F[render_report.py\\nMarkdown report]
  F -->|JSON + report| B
  B -->|inventory + summary| A`;
