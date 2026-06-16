# B3 — Test Discovery and Execution

**Root:** `/Users/pratikwarathe/pratik_ai_eval`  
**Discovered at:** 2026-06-17  
**Time box:** 15 minutes

## Summary

This repository has **one automated test suite**: the **reviewer web app** under `frontend/`. It uses **Vitest 3** with **jsdom** for React/TypeScript unit tests. There are **no Python tests** for the B1/B2 scanner scripts, and no separate Jest, pytest, or CI test configuration at the repo root.

| Item | Value |
|------|-------|
| Framework | [Vitest](https://vitest.dev/) v3.2.x |
| Runner config | `frontend/vite.config.ts` (`test` block) |
| Package script | `npm test` → `vitest run` |
| Test environment | jsdom (DOM APIs for React components) |
| Test files | 17 |
| Total tests | 29 |
| Last run result | **All passed** (exit 0) |

## Test framework and config

### Primary framework: Vitest

- **Dependency:** `vitest@^3.2.4` (resolved to v3.2.6 at run time) in `frontend/package.json`
- **Companion:** `jsdom@^26.1.0` for browser-like test environment
- **Import style:** tests import `{ describe, it, expect }` from `"vitest"`

### Config file: `frontend/vite.config.ts`

Vitest is configured inline via `defineConfig` from `"vitest/config"`:

```ts
test: {
  environment: "jsdom",
},
```

There is **no** separate `vitest.config.ts`, `jest.config.js`, or `setupTests.ts`. TypeScript for tests uses the same `frontend/tsconfig.json` (`include: ["src"]`); root-level `vite-plugin-b2-scan.test.ts` is picked up by Vitest’s default glob (`**/*.{test,spec}.{js,ts,tsx}`).

### What is *not* present

| Expected in some repos | Status |
|------------------------|--------|
| pytest / unittest (Python scanners) | Not found |
| Jest | Not used |
| Playwright / Cypress E2E | Not configured |
| CI test job (GitHub Actions, etc.) | Not found at repo root |
| Coverage config | Not configured |

## Relevant test files (17)

All paths relative to `frontend/`.

### Vite plugins

| File | Tests | Focus |
|------|------:|-------|
| `vite-plugin-b2-scan.test.ts` | 1 | B2 scan API route registration |

### Components

| File | Tests | Focus |
|------|------:|-------|
| `src/components/B1InventoryDemo.test.tsx` | 2 | B1 inventory demo UI |
| `src/components/B2EndpointDemo.test.tsx` | 1 | B2 endpoint demo UI |
| `src/components/Layout.test.tsx` | 1 | App shell layout |
| `src/components/TaskArchitectureView.test.tsx` | 1 | Architecture diagram view |
| `src/components/TaskCard.test.tsx` | 1 | Task card rendering |

### Pages

| File | Tests | Focus |
|------|------:|-------|
| `src/App.test.tsx` | 1 | Route definitions |
| `src/main.test.tsx` | 1 | App bootstrap |
| `src/pages/HowItWorksPage.test.tsx` | 1 | How-it-works page |
| `src/pages/TaskArchitecturePage.test.tsx` | 1 | Task architecture page |
| `src/pages/TaskDetailPage.test.tsx` | 1 | Task detail page |
| `src/pages/TaskListPage.test.tsx` | 1 | Task list page |
| `src/pages/taskArchitectures.test.ts` | 5 | Architecture metadata helpers |

### Lib / types

| File | Tests | Focus |
|------|------:|-------|
| `src/lib/bitbucketUrl.test.ts` | 4 | Bitbucket URL parsing |
| `src/types/endpoints.test.ts` | 2 | Endpoint type guards |
| `src/types/inventory.test.ts` | 2 | Inventory type guards |
| `src/types/tasks.test.ts` | 3 | Task type guards |

## Exact commands

### Prerequisites (first time)

```bash
cd frontend
npm install
```

### Run full suite (CI-style, single pass)

```bash
cd frontend
npm test
```

Equivalent:

```bash
cd frontend
npx vitest run
```

### Run in watch mode (development)

```bash
cd frontend
npx vitest
```

### Run a single file

```bash
cd frontend
npx vitest run src/lib/bitbucketUrl.test.ts
```

### Run tests matching a name pattern

```bash
cd frontend
npx vitest run -t "Bitbucket"
```

## Actual command result

Command executed:

```bash
cd /Users/pratikwarathe/pratik_ai_eval/frontend && npm test
```

Result: **17 test files, 29 tests — all passed** in ~3.5s. Full stdout captured in [`test-run-output.txt`](./test-run-output.txt).

```
 Test Files  17 passed (17)
      Tests  29 passed (29)
   Duration  3.50s
Exit code: 0
```

## Failures and interpretation

**No failures** in the latest run.

If tests fail in the future, typical causes in this repo:

| Symptom | Likely cause |
|---------|----------------|
| `Cannot find module` | Missing `npm install` or wrong working directory (must be `frontend/`) |
| Route / path assertion failures in `App.test.tsx` | React Router paths changed without updating tests |
| Type-guard failures in `src/types/*.test.ts` | JSON schema in `public/tasks.json` or artifact shapes changed |
| `bitbucketUrl` failures | URL parsing rules changed for B1/B2 Bitbucket scan inputs |
| jsdom / React 19 errors | Dependency version mismatch after upgrade |

**Gap:** B1/B2 Python scanners (`tasks/b1-*`, `tasks/b2-*`) have no automated tests. Validation is manual via CLI runs and the frontend demo UI.
