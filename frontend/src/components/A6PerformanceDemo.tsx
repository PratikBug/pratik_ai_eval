import { useEffect, useState } from "react";
import {
  A6_PERFORMANCE_REPORT_PATH,
  A6_SERVICE_BASE,
  type A6BenchmarkResponse,
  type A6ReportResponse,
  type A6TestsResponse,
} from "../types/a6Performance";

type LoadState = "idle" | "loading" | "done" | "error";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}

export function A6PerformanceDemo() {
  const [reportState, setReportState] = useState<LoadState>("idle");
  const [benchState, setBenchState] = useState<LoadState>("idle");
  const [testState, setTestState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<A6ReportResponse | null>(null);
  const [benchResult, setBenchResult] = useState<A6BenchmarkResponse | null>(null);
  const [testResult, setTestResult] = useState<A6TestsResponse | null>(null);

  useEffect(() => {
    void loadReport();
  }, []);

  async function loadReport() {
    setReportState("loading");
    setError(null);
    try {
      const response = await fetch(`${A6_SERVICE_BASE}/report`);
      const payload = await readJson<A6ReportResponse>(response);
      setReport(payload);
      setReportState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
      setReportState("error");
    }
  }

  async function runBenchmark() {
    setBenchState("loading");
    setError(null);
    setBenchResult(null);
    try {
      const response = await fetch(`${A6_SERVICE_BASE}/run-benchmark`, { method: "POST" });
      const payload = await readJson<A6BenchmarkResponse>(response);
      setBenchResult(payload);
      setBenchState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Benchmark failed");
      setBenchState("error");
    }
  }

  async function runTests() {
    setTestState("loading");
    setError(null);
    setTestResult(null);
    try {
      const response = await fetch(`${A6_SERVICE_BASE}/run-tests`, { method: "POST" });
      const payload = await readJson<A6TestsResponse>(response);
      setTestResult(payload);
      setTestState(payload.passed ? "done" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tests failed");
      setTestState("error");
    }
  }

  const summary = report?.summary;

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h3>A6 — Performance profiling</h3>
          <p className="muted">
            Loads <code>{A6_PERFORMANCE_REPORT_PATH}</code>, runs baseline vs batched benchmark on
            the N+1 catalog store, and verifies behavior with pytest.
          </p>
        </div>
      </div>

      <div className="demo-actions">
        <button type="button" onClick={() => void loadReport()} disabled={reportState === "loading"}>
          Reload report
        </button>
        <button type="button" onClick={() => void runBenchmark()} disabled={benchState === "loading"}>
          Run benchmark
        </button>
        <button type="button" onClick={() => void runTests()} disabled={testState === "loading"}>
          Run behavior tests
        </button>
      </div>

      {error ? <p className="demo-error">{error}</p> : null}

      {summary ? (
        <div className="demo-summary-grid">
          <div className="demo-stat">
            <span className="demo-stat-label">Bottleneck</span>
            <span className="demo-stat-value">{summary.bottleneck}</span>
          </div>
          <div className="demo-stat">
            <span className="demo-stat-label">Reported improvement</span>
            <span className="demo-stat-value">{summary.improvementPct}%</span>
          </div>
          {summary.baselineMs != null && summary.afterMs != null ? (
            <div className="demo-stat">
              <span className="demo-stat-label">Report latency</span>
              <span className="demo-stat-value">
                {summary.baselineMs} ms → {summary.afterMs} ms
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {benchResult ? (
        <div className="demo-output-block">
          <h4>Live benchmark (baseline vs batched)</h4>
          <ul className="demo-list">
            <li>Baseline: {benchResult.baselineMs?.toFixed(2) ?? "—"} ms</li>
            <li>After: {benchResult.afterMs?.toFixed(2) ?? "—"} ms</li>
            <li>Improvement: {benchResult.improvementPct?.toFixed(1) ?? "—"}%</li>
            <li>Products: {benchResult.productCount}</li>
          </ul>
          <pre className="demo-pre">{benchResult.output}</pre>
        </div>
      ) : null}

      {testResult ? (
        <div className="demo-output-block">
          <h4>Behavior tests</h4>
          <p className={testResult.passed ? "demo-success" : "demo-error"}>
            {testResult.passed
              ? `${testResult.passedCount} passed — identical output verified`
              : "Tests failed"}
          </p>
          <pre className="demo-pre">{testResult.output}</pre>
        </div>
      ) : null}

      {report?.report ? (
        <details className="demo-details">
          <summary>Performance report markdown</summary>
          <pre className="demo-pre demo-pre-scroll">{report.report}</pre>
        </details>
      ) : null}
    </section>
  );
}
