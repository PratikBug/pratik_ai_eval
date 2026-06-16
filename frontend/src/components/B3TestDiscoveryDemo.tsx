import { useEffect, useState } from "react";
import type { TestDiscoveryData, TestRunResponse, TestRunSummary } from "../types/tests";

type RunState = "idle" | "loading" | "done" | "error";

const CATEGORY_LABELS: Record<TestDiscoveryData["testFiles"][number]["category"], string> = {
  plugin: "Vite plugins",
  component: "Components",
  page: "Pages",
  lib: "Lib / types",
};

function formatSummary(summary: TestRunSummary): string {
  if (summary.testsPassed != null && summary.testFilesPassed != null) {
    return `${summary.testFilesPassed} files, ${summary.testsPassed} tests passed`;
  }
  return summary.passed ? "All tests passed" : "Tests failed";
}

export function B3TestDiscoveryDemo() {
  const [state, setState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestRunResponse | null>(null);
  const [savedDiscovery, setSavedDiscovery] = useState<string | null>(null);
  const [savedOutput, setSavedOutput] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/tasks/b3-test-discovery-and-execution/artifacts/test-discovery.md").then((response) =>
        response.ok ? response.text() : null,
      ),
      fetch("/tasks/b3-test-discovery-and-execution/artifacts/test-run-output.txt").then((response) =>
        response.ok ? response.text() : null,
      ),
    ]).then(([discovery, output]) => {
      setSavedDiscovery(discovery);
      setSavedOutput(output);
    });
  }, []);

  async function runTests() {
    setState("loading");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/b3/run-tests", { method: "POST" });
      const payload = (await response.json()) as TestRunResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Test run request failed");
      }

      setResult(payload);
      if (payload.savedDiscovery) setSavedDiscovery(payload.savedDiscovery);
      if (payload.savedOutput) setSavedOutput(payload.savedOutput);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed");
      setState("error");
    }
  }

  const discovery = result?.discovery;
  const summary = result?.summary;
  const liveOutput = result?.output;

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h2>Discover and run tests</h2>
          <p className="demo-copy">
            Discovers the Vitest suite in <code>frontend/</code>, lists every test file, and runs{" "}
            <code>npm test</code> on this machine. Saved artifacts from the B3 task are shown below;
            click run to refresh with a live execution.
          </p>
        </div>
      </div>

      <div className="demo-repo-list">
        <strong>What this demo covers</strong>
        <ul>
          <li>
            <strong>Framework:</strong> Vitest 3 with jsdom — config in{" "}
            <code>frontend/vite.config.ts</code>
          </li>
          <li>
            <strong>Command:</strong> <code>cd frontend && npm test</code>
          </li>
          <li>
            <strong>Gap:</strong> B1/B2 Python scanners have no automated tests yet
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void runTests()}
          disabled={state === "loading"}
        >
          {state === "loading" ? "Running tests…" : "Run tests now"}
        </button>
      </div>

      {state === "loading" && (
        <div className="scan-status">Running Vitest suite in frontend/ — this may take a few seconds…</div>
      )}

      {error && <div className="scan-error">{error}</div>}

      {discovery && summary && (
        <>
          <div className="scan-meta">
            <p>
              <strong>Framework:</strong> {discovery.framework}
              {discovery.frameworkVersion ? ` ${discovery.frameworkVersion}` : ""}
            </p>
            <p>
              <strong>Config:</strong> <code>{discovery.configFile}</code>
            </p>
            <p>
              <strong>Environment:</strong> {discovery.environment}
            </p>
            <p>
              <strong>Command:</strong> <code>{discovery.command}</code>
            </p>
            <p>
              <strong>Result:</strong>{" "}
              <span className={summary.passed ? "status-pill status-done" : "status-pill status-pending"}>
                {formatSummary(summary)}
              </span>
              {summary.durationMs != null && ` (${(summary.durationMs / 1000).toFixed(2)}s)`}
            </p>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <strong>{discovery.testFiles.length}</strong>
              <span>Test files</span>
            </div>
            <div className="summary-card">
              <strong>{summary.testsPassed ?? "—"}</strong>
              <span>Tests passed</span>
            </div>
            <div className="summary-card">
              <strong>{summary.passed ? "0" : "—"}</strong>
              <span>Failures</span>
            </div>
          </div>

          <div className="artifact-header">
            <h3>Discovered test files</h3>
          </div>
          <div className="test-file-table">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {discovery.testFiles.map((file) => (
                  <tr key={file.path}>
                    <td>
                      <code>{file.path}</code>
                    </td>
                    <td>{CATEGORY_LABELS[file.category]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {liveOutput && (
        <>
          <div className="artifact-header">
            <h3>Live test output</h3>
          </div>
          <pre className="artifact-preview">{liveOutput}</pre>
        </>
      )}

      {savedDiscovery && (
        <>
          <div className="artifact-header">
            <h3>Saved discovery report</h3>
            <code>tasks/b3-test-discovery-and-execution/artifacts/test-discovery.md</code>
          </div>
          <pre className="artifact-preview">{savedDiscovery}</pre>
        </>
      )}

      {!liveOutput && savedOutput && (
        <>
          <div className="artifact-header">
            <h3>Saved test run output</h3>
            <code>tasks/b3-test-discovery-and-execution/artifacts/test-run-output.txt</code>
          </div>
          <pre className="artifact-preview">{savedOutput}</pre>
        </>
      )}
    </section>
  );
}
