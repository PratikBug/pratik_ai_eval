# B2 — API Endpoint Map

**Time box:** 30 minutes  
**Status:** Done

## Goal

Identify every externally exposed API route or frontend route.

## Approach

1. Walk source files and detect route declarations via framework-specific patterns (FastAPI, Flask, Spring, Express, Vite middleware, React Router, Next.js, Go).
2. Enumerate static assets under `public/` directories.
3. Cross-reference `fetch()` calls to show which routes the UI consumes.
4. Emit structured JSON plus separate Markdown reports for API and frontend routes.

## Deliverables

| Artifact | Description |
|----------|-------------|
| `src/endpoint_scanner.py` | Multi-language route scanner (local path or remote URL) |
| `src/repo_source.py` | Bitbucket URL parsing and `git clone` helper |
| `src/scan_endpoints.py` | One-command scan + report generator |
| `src/render_endpoint_report.py` | JSON → Markdown report renderer |
| `artifacts/endpoints.json` | Machine-readable endpoint map (this eval repo) |
| `artifacts/api-endpoint-map.md` | API / middleware / static route table |
| `artifacts/frontend-routes.md` | SPA / client-side route table |

## Run

```bash
cd tasks/b2-api-endpoint-map
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Scan this eval repo (local)

```bash
python src/endpoint_scanner.py --root ../.. --output artifacts/endpoints.json
python src/render_endpoint_report.py \
  artifacts/endpoints.json \
  artifacts/api-endpoint-map.md \
  artifacts/frontend-routes.md
```

### One command

```bash
python src/scan_endpoints.py --root ../..
```

### Scan any Bitbucket repo by URL

```bash
python src/scan_endpoints.py --repo-url https://bitbucket.org/your-workspace/your-repo
```

## Findings for this repository

This eval repo has **no traditional backend service** (no Spring controllers or FastAPI apps yet). Exposed routes come from:

| Layer | Routes |
|-------|--------|
| **Vite dev middleware** | `POST /api/b1/scan`, `GET /tasks/*`, `GET /docs/*` |
| **Static (public/)** | `GET /tasks.json` |
| **React Router (SPA)** | `/`, `/how-it-works`, `/tasks/:taskId`, catch-all `*` → `/` |

See [artifacts/api-endpoint-map.md](artifacts/api-endpoint-map.md) and [artifacts/frontend-routes.md](artifacts/frontend-routes.md) for the full tables with source file and line references.

## Verification checklist

- [x] Scanner detects server-defined API/middleware routes with method, path, handler, source file
- [x] Scanner detects React Router frontend routes
- [x] Static public assets enumerated
- [x] Client `fetch()` targets cross-referenced
- [x] Reports generated for this repository as proof
- [x] Remote Bitbucket URL scanning via `git clone`

## Manual verification notes

The scanner uses regex heuristics. Items marked as `client-fetch` are **consumers**, not server route definitions. Vite middleware routes only exist during `npm run dev` / `npm run preview`, not in a production static build unless separately deployed.
