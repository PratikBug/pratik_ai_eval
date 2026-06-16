import { useEffect, useState } from "react";
import type { PytestRunResponse } from "../types/ledger";
import {
  I6_AGENT_VS_MANUAL,
  I6_ARTIFACT_PATHS,
  I6_BUGGY_FILE,
  I6_REPRO_CMD,
  I6_ROOT_CAUSE,
  I6_VERIFY_CMD,
  type I6ScriptRunResponse,
} from "../types/i6BugDiagnosis";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function I6BugDiagnosisDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [bugState, setBugState] = useState<RunState>("idle");
  const [testState, setTestState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [bugReport, setBugReport] = useState("");
  const [patchText, setPatchText] = useState("");
  const [savedProof, setSavedProof] = useState("");
  const [bugOutput, setBugOutput] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<PytestRunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [reportRes, patchRes, proofRes] = await Promise.all([
          fetch(`/${I6_ARTIFACT_PATHS.bugReport}`),
          fetch(`/${I6_ARTIFACT_PATHS.seededPatch}`),
          fetch(`/${I6_ARTIFACT_PATHS.fixVerification}`),
        ]);

        if (!reportRes.ok || !patchRes.ok || !proofRes.ok) {
          throw new Error("Could not load I6 artifacts");
        }

        const [report, patch, proof] = await Promise.all([
          reportRes.text(),
          patchRes.text(),
          proofRes.text(),
        ]);

        if (cancelled) return;
        setBugReport(report);
        setPatchText(patch);
        setSavedProof(proof);
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

  async function reproduceBug() {
    setBugState("running");
    setError(null);
    setBugOutput(null);

    try {
      const response = await fetch("/api/i6/show-bug", { method: "POST" });
      const payload = (await response.json()) as I6ScriptRunResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Reproduction failed");
      setBugOutput(payload.output);
      setBugState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reproduction failed");
      setBugState("error");
    }
  }

  async function runTests() {
    setTestState("running");
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch("/api/i6/run-tests", { method: "POST" });
      const payload = (await response.json()) as PytestRunResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Pytest failed");
      setTestResult(payload);
      setTestState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "Tests failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pytest failed");
      setTestState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>Live demo — bug diagnosis</h2>
        <p className="demo-copy">
          Seeded bug in unfamiliar module <code>{I6_BUGGY_FILE}</code>: free shipping threshold
          off-by-one (<code>{I6_ROOT_CAUSE.operator}</code> vs <code>{I6_ROOT_CAUSE.fix}</code>).
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Root cause</strong>
        <p>{I6_ROOT_CAUSE.summary}</p>
        <ul>
          <li>
            Function: <code>{I6_ROOT_CAUSE.function}()</code>
          </li>
          <li>
            File: <code>{I6_ROOT_CAUSE.line}</code>
          </li>
        </ul>
      </div>

      <h3>Agent suggested vs manually verified</h3>
      <div className="entity-table-wrap">
        <table className="entity-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Agent suggested</th>
              <th>Manually verified</th>
            </tr>
          </thead>
          <tbody>
            {I6_AGENT_VS_MANUAL.map((row) => (
              <tr key={row.topic}>
                <td>{row.topic}</td>
                <td>{row.agent}</td>
                <td>{row.manual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={bugState === "running"}
          onClick={() => void reproduceBug()}
        >
          {bugState === "running" ? "Reproducing…" : "1. Reproduce bug (live)"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={testState === "running"}
          onClick={() => void runTests()}
        >
          {testState === "running" ? "Running pytest…" : "2. Verify fix (pytest)"}
        </button>
      </div>

      <p className="demo-copy">
        CLI: <code>{I6_REPRO_CMD}</code> · <code>{I6_VERIFY_CMD}</code>
      </p>

      {bugOutput && (
        <>
          <h3>Reproduction output</h3>
          <pre className="artifact-preview">{bugOutput}</pre>
        </>
      )}

      {testResult && (
        <>
          <h3>Verification output</h3>
          <pre className="artifact-preview">{testResult.output}</pre>
        </>
      )}

      {state === "loading" && <p className="scan-status">Loading I6 artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}

      {state === "ready" && (
        <>
          <h3>Minimal fix (patch)</h3>
          <pre className="artifact-preview diagram-preview-full">{patchText}</pre>

          <h3>Full bug report</h3>
          <pre className="artifact-preview diagram-preview-full">{bugReport}</pre>

          <h3>Saved verification proof</h3>
          <pre className="artifact-preview diagram-preview-full">{savedProof}</pre>
        </>
      )}
    </section>
  );
}
