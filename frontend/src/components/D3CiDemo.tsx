import { useEffect, useState } from "react";
import {
  D3_ARTIFACT_PATHS,
  D3_CI_JOBS,
  D3_FAILURE_DEMO_CMD,
  D3_RUN_ACT_CMD,
  D3_RUN_LOCAL_CMD,
  type D3CiRunResponse,
} from "../types/d3Ci";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function D3CiDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [ciRunLog, setCiRunLog] = useState("");
  const [ciFailureLog, setCiFailureLog] = useState("");
  const [runResult, setRunResult] = useState<D3CiRunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [runRes, failRes] = await Promise.all([
          fetch(`/${D3_ARTIFACT_PATHS.ciRunLog}`),
          fetch(`/${D3_ARTIFACT_PATHS.ciFailureLog}`),
        ]);

        if (!runRes.ok || !failRes.ok) {
          throw new Error("Could not load D3 CI artifacts");
        }

        const [runText, failText] = await Promise.all([runRes.text(), failRes.text()]);

        if (cancelled) return;
        setCiRunLog(runText);
        setCiFailureLog(failText);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load artifacts");
        setState("error");
      }
    }

    void loadArtifacts();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runLocalCi() {
    setRunState("running");
    setError(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/d3/ci", { method: "POST" });
      const payload = (await response.json()) as D3CiRunResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "CI run failed");

      setRunResult(payload);
      if (payload.ciRunLog) setCiRunLog(payload.ciRunLog);
      setRunState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "CI exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "CI run failed");
      setRunState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <p className="eyebrow">Live reviewer demo</p>
        <h2>CI pipeline — lint, test, build image</h2>
        <p className="demo-copy">
          GitHub Actions workflow at <code>{D3_ARTIFACT_PATHS.workflow}</code> — lint (ruff),
          test (Python matrix + vitest), build D2 API Docker image. Re-run local CI from the
          browser or use <code>act</code> for full GHA simulation.
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Jobs</strong>
        <ul>
          {D3_CI_JOBS.map((job) => (
            <li key={job}>
              <code>{job}</code>
            </li>
          ))}
        </ul>
        <strong>Commands</strong>
        <ul>
          <li>
            <code>{D3_RUN_LOCAL_CMD}</code>
          </li>
          <li>
            <code>{D3_RUN_ACT_CMD}</code>
          </li>
          <li>
            <code>{D3_FAILURE_DEMO_CMD}</code>
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={runState === "running"}
          onClick={() => void runLocalCi()}
        >
          {runState === "running" ? "Running CI…" : "Re-run local CI"}
        </button>
        <a
          className="btn btn-secondary"
          href={`/${D3_ARTIFACT_PATHS.workflow}`}
          target="_blank"
          rel="noreferrer"
        >
          Open ci.yml
        </a>
      </div>

      {runResult && (
        <p className="scan-status">
          exit {runResult.exitCode}
          {runResult.exitCode === 0 ? " — pipeline green" : " — see output below"}
        </p>
      )}

      {state === "loading" && <p className="scan-status">Loading D3 CI artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}
      {runResult?.output && <pre className="artifact-preview">{runResult.output}</pre>}

      {state === "ready" && (
        <>
          <h3>Passing run (ci-run-log.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{ciRunLog}</pre>

          <h3>Failure demo (ci-failure-log.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{ciFailureLog}</pre>
        </>
      )}
    </section>
  );
}
