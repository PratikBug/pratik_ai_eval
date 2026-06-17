import { useEffect, useState } from "react";
import {
  A5_CODE_REVIEW_REPORT_PATH,
  A5_SERVICE_BASE,
  type A5GrepResponse,
  type A5ReportResponse,
  type A5VerifyResponse,
} from "../types/a5CodeReview";

type LoadState = "idle" | "loading" | "done" | "error";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}

export function A5CodeReviewDemo() {
  const [reportState, setReportState] = useState<LoadState>("idle");
  const [verifyState, setVerifyState] = useState<LoadState>("idle");
  const [grepState, setGrepState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<A5ReportResponse | null>(null);
  const [verifyResult, setVerifyResult] = useState<A5VerifyResponse | null>(null);
  const [grepResult, setGrepResult] = useState<A5GrepResponse | null>(null);

  useEffect(() => {
    void loadReport();
  }, []);

  async function loadReport() {
    setReportState("loading");
    setError(null);
    try {
      const response = await fetch(`${A5_SERVICE_BASE}/report`);
      const payload = await readJson<A5ReportResponse>(response);
      setReport(payload);
      setReportState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
      setReportState("error");
    }
  }

  async function runVerify() {
    setVerifyState("loading");
    setError(null);
    setVerifyResult(null);
    try {
      const response = await fetch(`${A5_SERVICE_BASE}/verify`, { method: "POST" });
      const payload = await readJson<A5VerifyResponse>(response);
      setVerifyResult(payload);
      setVerifyState(payload.passed ? "done" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setVerifyState("error");
    }
  }

  async function grepSecrets() {
    setGrepState("loading");
    setError(null);
    setGrepResult(null);
    try {
      const response = await fetch(
        `${A5_SERVICE_BASE}/grep?pattern=${encodeURIComponent("INTERNAL_API_KEY|sk-agent")}`,
      );
      const payload = await readJson<A5GrepResponse>(response);
      setGrepResult(payload);
      setGrepState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grep failed");
      setGrepState("error");
    }
  }

  const summary = report?.summary;

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h3>A5 — Agent code review</h3>
          <p className="muted">
            Loads <code>{A5_CODE_REVIEW_REPORT_PATH}</code>, shows PR file list and issue counts,
            runs adversarial verification and secret grep.
          </p>
        </div>
      </div>

      <div className="demo-actions">
        <button type="button" onClick={() => void loadReport()} disabled={reportState === "loading"}>
          Reload report
        </button>
        <button type="button" onClick={() => void grepSecrets()} disabled={grepState === "loading"}>
          Grep secrets
        </button>
        <button type="button" onClick={() => void runVerify()} disabled={verifyState === "loading"}>
          Run verify.sh
        </button>
      </div>

      {reportState === "loading" && <p className="scan-status">Loading code review report…</p>}

      {summary && (
        <div className="scan-summary">
          <p>
            <strong>Verdict:</strong> {summary.verdict}
          </p>
          <p>
            <strong>Issues:</strong> {summary.totalIssues} total · <strong>{summary.blocking}</strong>{" "}
            blocking
          </p>
          <p>
            <strong>By severity:</strong> critical {summary.bySeverity.critical}, high{" "}
            {summary.bySeverity.high}, medium {summary.bySeverity.medium}, low{" "}
            {summary.bySeverity.low}
          </p>
          {report?.patchLines ? (
            <p>
              <strong>PR patch:</strong> {report.patchLines} lines · <strong>Files:</strong>{" "}
              {report.prFiles.length} in review-target/
            </p>
          ) : null}
        </div>
      )}

      {report?.prFiles && report.prFiles.length > 0 && (
        <details className="scan-details">
          <summary>PR file list ({report.prFiles.length})</summary>
          <ul className="scan-file-list">
            {report.prFiles.map((file) => (
              <li key={file}>
                <code>{file}</code>
              </li>
            ))}
          </ul>
        </details>
      )}

      {grepState === "loading" && <p className="scan-status">Scanning for hardcoded secrets…</p>}
      {grepResult && (
        <div className="scan-result scan-result-error">
          <p>
            <strong>Grep</strong> ({grepResult.pattern}): {grepResult.count} match
            {grepResult.count === 1 ? "" : "es"}
          </p>
          {grepResult.matches.length > 0 && (
            <pre className="scan-output">{grepResult.matches.join("\n")}</pre>
          )}
        </div>
      )}

      {verifyState === "loading" && (
        <p className="scan-status">Running adversarial verification (pytest + probes)…</p>
      )}
      {verifyResult && (
        <div className={`scan-result ${verifyResult.passed ? "scan-result-ok" : "scan-result-error"}`}>
          <p>
            <strong>Exit code:</strong> {verifyResult.exitCode}{" "}
            {verifyResult.passed ? "(passed)" : "(failed)"}
          </p>
          <pre className="scan-output">{verifyResult.output}</pre>
        </div>
      )}

      {error && <p className="scan-error">{error}</p>}

      {report?.report && (
        <details className="scan-details">
          <summary>Full code review report</summary>
          <pre className="scan-output">{report.report}</pre>
        </details>
      )}
    </section>
  );
}
