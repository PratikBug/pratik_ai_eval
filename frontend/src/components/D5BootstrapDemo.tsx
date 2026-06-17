import { useEffect, useState } from "react";
import {
  D5_ARTIFACT_PATHS,
  D5_BOOTSTRAP_CMD,
  D5_MAKE_TARGETS,
  D5_VERIFY_CMD,
  type D5BootstrapRunResponse,
} from "../types/d5Bootstrap";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function D5BootstrapDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [bootstrapLog, setBootstrapLog] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [implicitDeps, setImplicitDeps] = useState("");
  const [runResult, setRunResult] = useState<D5BootstrapRunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [bootRes, testRes, depsRes] = await Promise.all([
          fetch(`/${D5_ARTIFACT_PATHS.bootstrapLog}`),
          fetch(`/${D5_ARTIFACT_PATHS.testOutput}`),
          fetch(`/${D5_ARTIFACT_PATHS.implicitDeps}`),
        ]);

        if (!bootRes.ok || !testRes.ok || !depsRes.ok) {
          throw new Error("Could not load D5 bootstrap artifacts");
        }

        const [bootText, testText, depsText] = await Promise.all([
          bootRes.text(),
          testRes.text(),
          depsRes.text(),
        ]);

        if (cancelled) return;
        setBootstrapLog(bootText);
        setTestOutput(testText);
        setImplicitDeps(depsText);
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

  async function runBootstrap() {
    setRunState("running");
    setError(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/d5/bootstrap", { method: "POST" });
      const payload = (await response.json()) as D5BootstrapRunResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Bootstrap run failed");

      setRunResult(payload);
      if (payload.bootstrapLog) setBootstrapLog(payload.bootstrapLog);
      if (payload.testOutput) setTestOutput(payload.testOutput);
      setRunState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "Bootstrap exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bootstrap run failed");
      setRunState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <p className="eyebrow">Live reviewer demo</p>
        <h2>Reproducible dev environment — make bootstrap</h2>
        <p className="demo-copy">
          Single-command bootstrap via <code>{D5_BOOTSTRAP_CMD}</code> — mise pins Node 20 and
          Python 3.11, installs deps from lockfiles, runs ruff + pytest + vitest. Config at{" "}
          <code>{D5_ARTIFACT_PATHS.miseToml}</code> and <code>{D5_ARTIFACT_PATHS.makefile}</code>.
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Make targets</strong>
        <ul>
          {D5_MAKE_TARGETS.map((target) => (
            <li key={target}>
              <code>make {target}</code>
            </li>
          ))}
        </ul>
        <strong>Commands</strong>
        <ul>
          <li>
            <code>{D5_BOOTSTRAP_CMD}</code>
          </li>
          <li>
            <code>{D5_VERIFY_CMD}</code>
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={runState === "running"}
          onClick={() => void runBootstrap()}
        >
          {runState === "running" ? "Running bootstrap…" : "Re-run bootstrap"}
        </button>
        <a
          className="btn btn-secondary"
          href={`/${D5_ARTIFACT_PATHS.implicitDeps}`}
          target="_blank"
          rel="noreferrer"
        >
          Open implicit-deps.md
        </a>
      </div>

      {runResult && (
        <p className="scan-status">
          exit {runResult.exitCode}
          {runResult.exitCode === 0 ? " — bootstrap green" : " — see output below"}
        </p>
      )}

      {state === "loading" && <p className="scan-status">Loading D5 bootstrap artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}
      {runResult?.output && <pre className="artifact-preview">{runResult.output}</pre>}

      {state === "ready" && (
        <>
          <h3>Bootstrap log (bootstrap-log.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{bootstrapLog}</pre>

          <h3>Test output (test-output.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{testOutput}</pre>

          <h3>Previously implicit deps (implicit-deps.md)</h3>
          <pre className="artifact-preview diagram-preview-full">{implicitDeps}</pre>
        </>
      )}
    </section>
  );
}
