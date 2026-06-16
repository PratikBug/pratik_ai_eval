import { useEffect, useState } from "react";
import {
  B6_MISSING_LOG,
  B6_SAMPLE_LOG,
  type CargoTestResponse,
  type CliRunResponse,
  parseLogCounterOutput,
} from "../types/logCounter";

type RunState = "idle" | "loading" | "done" | "error";

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json()) as T & { error?: string };
}

export function B6RustDemo() {
  const [testState, setTestState] = useState<RunState>("idle");
  const [cliState, setCliState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<CargoTestResponse | null>(null);
  const [cliResult, setCliResult] = useState<CliRunResponse | null>(null);
  const [savedProof, setSavedProof] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/tasks/b6-rust-greenfield/artifacts/run-proof.txt")
      .then((response) => (response.ok ? response.text() : null))
      .then(setSavedProof);
  }, []);

  async function runCargoTests() {
    setTestState("loading");
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch("/api/b6/run-tests", { method: "POST" });
      const payload = await readJson<CargoTestResponse>(response);
      if (!response.ok) throw new Error(payload.error || "cargo test failed");
      setTestResult(payload);
      if (payload.savedProof) setSavedProof(payload.savedProof);
      setTestState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "cargo test failed");
      setTestState("error");
    }
  }

  async function runCli(file: string) {
    setCliState("loading");
    setError(null);
    setCliResult(null);

    try {
      const response = await fetch("/api/b6/run-cli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file }),
      });
      const payload = await readJson<CliRunResponse>(response);
      if (!response.ok) throw new Error(payload.error || "cargo run failed");

      setCliResult({
        ...payload,
        counts: parseLogCounterOutput(payload.output),
      });
      setCliState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "cargo run failed");
      setCliState("error");
    }
  }

  const counts = cliResult?.counts;

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h2>Rust log-counter CLI</h2>
          <p className="demo-copy">
            Runs <code>cargo test</code> and <code>cargo run -- sample.log</code> from{" "}
            <code>tasks/b6-rust-greenfield/</code>. The CLI counts INFO, WARN, and ERROR tokens per
            line and exits cleanly when the file is missing.
          </p>
        </div>
      </div>

      <div className="demo-repo-list">
        <strong>Prerequisites</strong>
        <ul>
          <li>Rust toolchain on PATH (<code>cargo</code>, <code>rustc</code>)</li>
          <li>
            First run may compile dependencies — allow ~20s for <code>cargo test</code>
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void runCargoTests()}
          disabled={testState === "loading"}
        >
          {testState === "loading" ? "Running cargo test…" : "Run cargo test"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void runCli(B6_SAMPLE_LOG)}
          disabled={cliState === "loading"}
        >
          {cliState === "loading" ? "Running CLI…" : `Run on ${B6_SAMPLE_LOG}`}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void runCli(B6_MISSING_LOG)}
          disabled={cliState === "loading"}
        >
          Demo missing file
        </button>
      </div>

      {(testState === "loading" || cliState === "loading") && (
        <div className="scan-status">
          {testState === "loading"
            ? "Running cargo test in tasks/b6-rust-greenfield/…"
            : "Running log-counter via cargo run…"}
        </div>
      )}

      {error && <div className="scan-error">{error}</div>}

      {testResult && (
        <>
          <div className="scan-meta">
            <p>
              <strong>cargo test:</strong>{" "}
              <span
                className={
                  testResult.summary.passed ? "status-pill status-done" : "status-pill status-pending"
                }
              >
                {testResult.summary.testsPassed ?? 0} passed
                {testResult.summary.durationMs != null
                  ? ` (${(testResult.summary.durationMs / 1000).toFixed(2)}s)`
                  : ""}
              </span>
            </p>
          </div>
          <div className="artifact-header">
            <h3>Live cargo test output</h3>
          </div>
          <pre className="artifact-preview">{testResult.output}</pre>
        </>
      )}

      {counts && cliResult?.exitCode === 0 && (
        <div className="summary-grid">
          <div className="summary-card">
            <strong>{counts.info}</strong>
            <span>INFO lines</span>
          </div>
          <div className="summary-card">
            <strong>{counts.warn}</strong>
            <span>WARN lines</span>
          </div>
          <div className="summary-card">
            <strong>{counts.error}</strong>
            <span>ERROR lines</span>
          </div>
        </div>
      )}

      {cliResult && (
        <>
          <div className="scan-meta">
            <p>
              <strong>Command:</strong> <code>{cliResult.command}</code>
            </p>
            <p>
              <strong>Exit code:</strong> {cliResult.exitCode}
            </p>
          </div>
          {cliResult.output && (
            <>
              <div className="artifact-header">
                <h3>CLI stdout</h3>
              </div>
              <pre className="artifact-preview">{cliResult.output}</pre>
            </>
          )}
          {cliResult.stderr && (
            <>
              <div className="artifact-header">
                <h3>CLI stderr</h3>
              </div>
              <pre className="artifact-preview">{cliResult.stderr}</pre>
            </>
          )}
        </>
      )}

      {savedProof && !testResult && !cliResult && (
        <>
          <div className="artifact-header">
            <h3>Saved run proof</h3>
            <code>tasks/b6-rust-greenfield/artifacts/run-proof.txt</code>
          </div>
          <pre className="artifact-preview">{savedProof}</pre>
        </>
      )}
    </section>
  );
}
