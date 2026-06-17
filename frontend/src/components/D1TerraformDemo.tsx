import { useEffect, useState } from "react";
import {
  D1_ARTIFACT_PATHS,
  D1_STACK_COMPONENTS,
  D1_VERIFY_CMD,
  type D1VerifyResponse,
} from "../types/d1Terraform";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function D1TerraformDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [validateOutput, setValidateOutput] = useState("");
  const [planOutput, setPlanOutput] = useState("");
  const [runResult, setRunResult] = useState<D1VerifyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [validateRes, planRes] = await Promise.all([
          fetch(`/${D1_ARTIFACT_PATHS.validate}`),
          fetch(`/${D1_ARTIFACT_PATHS.plan}`),
        ]);

        if (!validateRes.ok || !planRes.ok) {
          throw new Error("Could not load D1 terraform artifacts");
        }

        const [validateText, planText] = await Promise.all([
          validateRes.text(),
          planRes.text(),
        ]);

        if (cancelled) return;
        setValidateOutput(validateText);
        setPlanOutput(planText);
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

  async function runVerification() {
    setRunState("running");
    setError(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/d1/verify", { method: "POST" });
      const payload = (await response.json()) as D1VerifyResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Verification failed");

      setRunResult(payload);
      if (payload.validateOutput) setValidateOutput(payload.validateOutput);
      if (payload.planOutput) setPlanOutput(payload.planOutput);
      setRunState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "Verification exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setRunState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <p className="eyebrow">Live reviewer demo</p>
        <h2>Terraform validate and plan</h2>
        <p className="demo-copy">
          S3 + Lambda + API Gateway stack targeting LocalStack on{" "}
          <code>localhost:4566</code>. Saved artifacts load on open; re-run{" "}
          <code>scripts/verify.sh</code> from the browser when Terraform and Docker are
          available on this machine.
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Stack components</strong>
        <ul>
          {D1_STACK_COMPONENTS.map((component) => (
            <li key={component}>
              <code>{component}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="demo-repo-list">
        <strong>Verify command</strong>
        <ul>
          <li>
            <code>{D1_VERIFY_CMD}</code>
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={runState === "running"}
          onClick={() => void runVerification()}
        >
          {runState === "running" ? "Running terraform verify…" : "Re-run verify"}
        </button>
        <a
          className="btn btn-secondary"
          href={`/${D1_ARTIFACT_PATHS.validate}`}
          target="_blank"
          rel="noreferrer"
        >
          Open validate artifact
        </a>
        <a
          className="btn btn-secondary"
          href={`/${D1_ARTIFACT_PATHS.plan}`}
          target="_blank"
          rel="noreferrer"
        >
          Open plan artifact
        </a>
      </div>

      {runResult && (
        <p className="scan-status">
          Exit code: <code>{runResult.exitCode}</code>
        </p>
      )}

      {state === "loading" && <p className="scan-status">Loading D1 artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}
      {runResult?.output && <pre className="artifact-preview">{runResult.output}</pre>}

      {(state === "ready" || validateOutput || planOutput) && (
        <>
          <h3>terraform validate</h3>
          <pre className="artifact-preview diagram-preview-full">{validateOutput}</pre>

          <h3>terraform plan</h3>
          <pre className="artifact-preview diagram-preview-full">{planOutput}</pre>
        </>
      )}
    </section>
  );
}
