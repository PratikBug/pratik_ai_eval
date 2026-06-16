# Frontend Route Map

**Root:** `/Users/pratikwarathe/pratik_ai_eval`  
**Scanned at:** 2026-06-16T20:54:46.579951+00:00  

## Summary

- **Client-side routes:** 4

## React / SPA routes

| Path | Component / handler | Source | Framework | Notes |
| --- | --- | --- | --- | --- |
| `*` | Navigate → / | `frontend/src/App.tsx:14` | react-router | Catch-all redirect to / |
| `/` | TaskListPage | `frontend/src/App.tsx:11` | react-router |  |
| `/how-it-works` | HowItWorksPage | `frontend/src/App.tsx:12` | react-router |  |
| `/tasks/:taskId` | TaskDetailPage | `frontend/src/App.tsx:13` | react-router |  |


## Runtime

The reviewer app is a Vite + React SPA. In development (`npm run dev`),
all unmatched paths fall through to the SPA shell after static/middleware handling.
