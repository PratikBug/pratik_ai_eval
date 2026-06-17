import { useEffect, useState } from "react";
import {
  D2_ARTIFACT_PATHS,
  D2_COMPOSE_UP_CMD,
  D2_E2E_CMD,
  D2_STACK_SERVICES,
  D2_TEARDOWN_CMD,
  type D2E2eResponse,
} from "../types/d2Docker";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function D2DockerDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [e2eOutput, setE2eOutput] = useState("");
  const [serviceLogs, setServiceLogs] = useState("");
  const [runResult, setRunResult] = useState<D2E2eResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [e2eRes, logsRes] = await Promise.all([
          fetch(`/${D2_ARTIFACT_PATHS.e2eOutput}`),
          fetch(`/${D2_ARTIFACT_PATHS.serviceLogs}`),
        ]);

        if (!e2eRes.ok || !logsRes.ok) {
          throw new Error("Could not load D2 artifacts");
        }

        const [e2eText, logsText] = await Promise.all([e2eRes.text(), logsRes.text()]);

        if (cancelled) return;
        setE2eOutput(e2eText);
        setServiceLogs(logsText);
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

  async function runE2e() {
    setRunState("running");
    setError(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/d2/e2e", { method: "POST" });
      const payload = (await response.json()) as D2E2eResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "E2E run failed");

      setRunResult(payload);
      if (payload.e2eOutput) setE2eOutput(payload.e2eOutput);
      if (payload.serviceLogs) setServiceLogs(payload.serviceLogs);
      setRunState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "E2E exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "E2E run failed");
      setRunState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <p className="eyebrow">Live reviewer demo</p>
        <h2>docker-compose stack with E2E tests</h2>
        <p className="demo-copy">
          Three-service stack: FastAPI API, Postgres, and a background worker. Seed data loads on
          first boot; pytest hits the running stack on port <code>8090</code>. Re-run{" "}
          <code>scripts/e2e.sh</code> from the browser when Docker is available.
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Services</strong>
        <ul>
          {D2_STACK_SERVICES.map((service) => (
            <li key={service}>
              <code>{service}</code>
            </li>
          ))}
        </ul>
        <strong>Commands</strong>
        <ul>
          <li>
            <code>{D2_E2E_CMD}</code>
          </li>
          <li>
            <code>{D2_COMPOSE_UP_CMD}</code>
          </li>
          <li>
            <code>{D2_TEARDOWN_CMD}</code>
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={runState === "running"}
          onClick={() => void runE2e()}
        >
          {runState === "running" ? "Running E2E…" : "Re-run E2E verify"}
        </button>
        <a
          className="btn btn-secondary"
          href={`/${D2_ARTIFACT_PATHS.compose}`}
          target="_blank"
          rel="noreferrer"
        >
          Open docker-compose.yml
        </a>
      </div>

      {runResult && (
        <p className="scan-status">
          exit {runResult.exitCode}
          {runResult.exitCode === 0 ? " — all tests green" : " — see output below"}
        </p>
      )}

      {state === "loading" && <p className="scan-status">Loading D2 artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}
      {runResult?.output && <pre className="artifact-preview">{runResult.output}</pre>}

      {state === "ready" && (
        <>
          <h3>E2E output</h3>
          <pre className="artifact-preview diagram-preview-full">{e2eOutput}</pre>

          <h3>Service logs (inter-service proof)</h3>
          <pre className="artifact-preview diagram-preview-full">{serviceLogs}</pre>
        </>
      )}
    </section>
  );
}
