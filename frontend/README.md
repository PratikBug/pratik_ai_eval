# Frontend — Coding Agent Eval Reviewer

Web app for reviewers to browse eval tasks, open READMEs, and preview artifacts.

## Run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Data source

Task metadata lives in `public/tasks.json`. Update task status and paths there when completing each eval item.

Artifact files are served from the repo root via Vite `fs.allow` so reviewers can open `tasks/*/artifacts/*` in the browser during local dev.
