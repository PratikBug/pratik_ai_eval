import { useEffect, useState } from "react";
import {
  D6_ARTIFACT_PATHS,
  D6_GRAFANA_URL,
  D6_LOAD_CMD,
  D6_UP_CMD,
  D6_VERIFY_CMD,
  type D6ObservabilityRunResponse,
} from "../types/d6Observability";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function D6ObservabilityDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dashboardPanel, setDashboardPanel] = useState("");
  const [loadOutput, setLoadOutput] = useState("");
  const [metricsSample, setMetricsSample] = useState("");
  const [structuredLogs, setStructuredLogs] = useState("");
  const [instrumentationDiff, setInstrumentationDiff] = useState("");
  const [runResult, setRunResult] = useState<D6ObservabilityRunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [panelRes, loadRes, metricsRes, logsRes, diffRes] = await Promise.all([
          fetch(`/${D6_ARTIFACT_PATHS.dashboardPanel}`),
          fetch(`/${D6_ARTIFACT_PATHS.loadOutput}`),
          fetch(`/${D6_ARTIFACT_PATHS.metricsSample}`),
          fetch(`/${D6_ARTIFACT_PATHS.structuredLogs}`),
          fetch(`/${D6_ARTIFACT_PATHS.instrumentationDiff}`),
        ]);

        if (!panelRes.ok || !loadRes.ok || !metricsRes.ok) {
          throw new Error("Could not load D6 observability artifacts");
        }

        const [panelText, loadText, metricsText, logsText, diffText] = await Promise.all([
          panelRes.text(),
          loadRes.text(),
          metricsRes.text(),
          logsRes.ok ? logsRes.text() : "",
          diffRes.ok ? diffRes.text() : "",
        ]);

        if (cancelled) return;
        setDashboardPanel(panelText);
        setLoadOutput(loadText);
        setMetricsSample(metricsText);
        setStructuredLogs(logsText);
        setInstrumentationDiff(diffText);
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

  async function runVerify() {
    setRunState("running");
    setError(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/d6/observability", { method: "POST" });
      const payload = (await response.json()) as D6ObservabilityRunResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Verify run failed");

      setRunResult(payload);
      if (payload.dashboardPanel) setDashboardPanel(payload.dashboardPanel);
      if (payload.loadOutput) setLoadOutput(payload.loadOutput);
      if (payload.metricsSample) setMetricsSample(payload.metricsSample);
      setRunState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "Verify exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify run failed");
      setRunState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <p className="eyebrow">Live reviewer demo</p>
        <h2>Observability — structured logs, /metrics, Grafana</h2>
        <p className="demo-copy">
          D2 job API instrumented with JSON logging and Prometheus metrics. Stack includes
          Prometheus + Grafana with provisioned dashboard panel fed by{" "}
          <code>{D6_LOAD_CMD}</code>.
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Commands</strong>
        <ul>
          <li>
            <code>{D6_VERIFY_CMD}</code>
          </li>
          <li>
            <code>{D6_UP_CMD}</code>
          </li>
          <li>
            <code>{D6_LOAD_CMD}</code>
          </li>
        </ul>
        <strong>Grafana</strong>
        <ul>
          <li>
            <a href={D6_GRAFANA_URL} target="_blank" rel="noreferrer">
              {D6_GRAFANA_URL}
            </a>
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={runState === "running"}
          onClick={() => void runVerify()}
        >
          {runState === "running" ? "Running verify…" : "Re-run verify"}
        </button>
        <a
          className="btn btn-secondary"
          href={`/${D6_ARTIFACT_PATHS.compose}`}
          target="_blank"
          rel="noreferrer"
        >
          Open docker-compose.yml
        </a>
      </div>

      {runResult && (
        <p className="scan-status">
          exit {runResult.exitCode}
          {runResult.exitCode === 0 ? " — observability stack healthy" : " — see output below"}
        </p>
      )}

      {state === "loading" && <p className="scan-status">Loading D6 observability artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}
      {runResult?.output && <pre className="artifact-preview">{runResult.output}</pre>}

      {state === "ready" && (
        <>
          <h3>Dashboard panel data (dashboard-panel.json)</h3>
          <pre className="artifact-preview diagram-preview-full">{dashboardPanel}</pre>

          <h3>Instrumentation diff (instrumentation-diff.patch)</h3>
          <pre className="artifact-preview diagram-preview-full">{instrumentationDiff}</pre>

          <h3>Load output (load-output.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{loadOutput}</pre>

          <h3>Metrics sample (metrics-sample.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{metricsSample}</pre>

          <h3>Structured logs (structured-log-sample.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{structuredLogs}</pre>
        </>
      )}
    </section>
  );
}
