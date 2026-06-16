import { useEffect, useState } from "react";
import type { PytestRunResponse } from "../types/ledger";
import {
  I3_AGENT_VS_MANUAL,
  I3_ARTIFACT_PATHS,
  I3_CHANGE_BRANCH,
  I3_CHANGE_VIEWS,
  I3_CHANGED_FILES,
  I3_TARGET_MODULE,
  I3_TEST_COMMAND,
  type I3ChangeView,
} from "../types/i3SafeChange";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json()) as T & { error?: string };
}

export function I3SafeChangeDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [summaryMd, setSummaryMd] = useState("");
  const [riskMd, setRiskMd] = useState("");
  const [patchText, setPatchText] = useState("");
  const [savedTestOutput, setSavedTestOutput] = useState("");
  const [view, setView] = useState<I3ChangeView>("summary");
  const [runState, setRunState] = useState<RunState>("idle");
  const [liveTestOutput, setLiveTestOutput] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [summaryRes, riskRes, patchRes, testRes] = await Promise.all([
          fetch(`/${I3_ARTIFACT_PATHS.changeSummary}`),
          fetch(`/${I3_ARTIFACT_PATHS.riskAssessment}`),
          fetch(`/${I3_ARTIFACT_PATHS.changePatch}`),
          fetch(`/${I3_ARTIFACT_PATHS.testOutput}`),
        ]);

        if (!summaryRes.ok || !riskRes.ok || !patchRes.ok || !testRes.ok) {
          throw new Error("Could not load I3 artifacts");
        }

        const [summary, risk, patch, tests] = await Promise.all([
          summaryRes.text(),
          riskRes.text(),
          patchRes.text(),
          testRes.text(),
        ]);

        if (cancelled) return;
        setSummaryMd(summary);
        setRiskMd(risk);
        setPatchText(patch);
        setSavedTestOutput(tests);
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

  async function runB6Tests() {
    setRunState("running");
    setError(null);
    setLiveTestOutput(null);

    try {
      const response = await fetch("/api/b6/run-tests", { method: "POST" });
      const payload = await readJson<PytestRunResponse>(response);
      if (!response.ok) throw new Error(payload.error || "cargo test failed");
      setLiveTestOutput(payload.output);
      setRunState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed");
      setRunState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>Live demo — small safe change</h2>
        <p className="demo-copy">
          Minimal change in unfamiliar module <code>{I3_TARGET_MODULE.path}</code>:{" "}
          {I3_TARGET_MODULE.change} in <code>{I3_TARGET_MODULE.function}()</code>.
          Branch: <code>{I3_CHANGE_BRANCH}</code>.
        </p>
      </div>

      <h3>Files changed</h3>
      <div className="entity-table-wrap">
        <table className="entity-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {I3_CHANGED_FILES.map((file) => (
              <tr key={file.path}>
                <td>
                  <code>{file.path}</code>
                </td>
                <td>{file.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            {I3_AGENT_VS_MANUAL.map((row) => (
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
          disabled={runState === "running"}
          onClick={() => void runB6Tests()}
        >
          {runState === "running" ? "Running cargo test…" : "Run B6 tests (verify change)"}
        </button>
        <code className="demo-copy">{I3_TEST_COMMAND}</code>
      </div>

      {runState === "done" && liveTestOutput && (
        <pre className="artifact-preview">{liveTestOutput}</pre>
      )}

      {state === "loading" && <p className="scan-status">Loading I3 artifacts…</p>}
      {state === "error" && error && <p className="scan-error">{error}</p>}

      {state === "ready" && (
        <>
          <div className="view-toggle" role="tablist" aria-label="I3 change view">
            {I3_CHANGE_VIEWS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                className={`view-toggle-btn${view === option.id ? " is-active" : ""}`}
                aria-selected={view === option.id}
                onClick={() => setView(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {view === "summary" && (
            <pre className="artifact-preview diagram-preview-full">{summaryMd}</pre>
          )}
          {view === "risk" && (
            <pre className="artifact-preview diagram-preview-full">{riskMd}</pre>
          )}
          {view === "patch" && (
            <pre className="artifact-preview diagram-preview-full">{patchText}</pre>
          )}
          {view === "tests" && (
            <pre className="artifact-preview diagram-preview-full">{savedTestOutput}</pre>
          )}
        </>
      )}
    </section>
  );
}
