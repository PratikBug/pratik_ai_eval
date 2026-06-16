# API Endpoint Map

**Root:** `/Users/pratikwarathe/pratik_ai_eval`  
**Scanned at:** 2026-06-16T20:54:46.579951+00:00  
**Files scanned:** 34

## Summary

- **API / middleware routes:** 8
- **Static file routes:** 1

## API & middleware routes

### Server-defined routes

| Method | Path | Handler | Source | Framework | Environment / notes |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/b1/scan` | middleware handler | `frontend/vite-plugin-b1-scan.ts:51` | vite-middleware | dev/preview — Vite dev/preview server only |
| GET | `/docs/*` | serve-repo-artifacts middleware | `frontend/vite.config.ts:18` | vite-middleware | dev/preview — Serves matching repo files with inferred content type |
| GET | `/tasks/*` | serve-repo-artifacts middleware | `frontend/vite.config.ts:18` | vite-middleware | dev/preview — Serves matching repo files with inferred content type |

### Client fetch targets (consumed by UI)

| Method | Path | Handler | Source | Framework | Environment / notes |
| --- | --- | --- | --- | --- | --- |
| GET/POST | `/${task.demoPath}` | fetch() client call | `frontend/src/pages/TaskDetailPage.tsx:28` | client-fetch | all — Consumed by frontend; not a server route definition |
| GET/POST | `/api/b1/scan` | fetch() client call | `frontend/src/components/B1InventoryDemo.tsx:33` | client-fetch | all — Consumed by frontend; not a server route definition |
| GET/POST | `/api/b1/scan` | fetch() client call | `frontend/src/pages/howItWorksContent.ts:27` | client-fetch | all — Consumed by frontend; not a server route definition |
| GET/POST | `/tasks.json` | fetch() client call | `frontend/src/pages/TaskDetailPage.tsx:16` | client-fetch | all — Consumed by frontend; not a server route definition |
| GET/POST | `/tasks.json` | fetch() client call | `frontend/src/pages/TaskListPage.tsx:11` | client-fetch | all — Consumed by frontend; not a server route definition |

## Static routes

| Method | Path | Handler | Source | Notes |
| --- | --- | --- | --- | --- |
| GET | `/tasks.json` | static file | `frontend/public/tasks.json` | Served from public/ at dev and build time |
