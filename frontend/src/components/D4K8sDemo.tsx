import { useEffect, useState } from "react";
import {
  D4_ARTIFACT_PATHS,
  D4_DOWN_CMD,
  D4_MANIFESTS,
  D4_UP_CMD,
  D4_VERIFY_CMD,
  type D4K8sRunResponse,
} from "../types/d4K8s";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function D4K8sDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dryRunLog, setDryRunLog] = useState("");
  const [applyLog, setApplyLog] = useState("");
  const [curlProof, setCurlProof] = useState("");
  const [runResult, setRunResult] = useState<D4K8sRunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [dryRes, applyRes, curlRes] = await Promise.all([
          fetch(`/${D4_ARTIFACT_PATHS.dryRun}`),
          fetch(`/${D4_ARTIFACT_PATHS.apply}`),
          fetch(`/${D4_ARTIFACT_PATHS.curlProof}`),
        ]);

        if (!dryRes.ok || !applyRes.ok || !curlRes.ok) {
          throw new Error("Could not load D4 K8s artifacts");
        }

        const [dryText, applyText, curlText] = await Promise.all([
          dryRes.text(),
          applyRes.text(),
          curlRes.text(),
        ]);

        if (cancelled) return;
        setDryRunLog(dryText);
        setApplyLog(applyText);
        setCurlProof(curlText);
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
      const response = await fetch("/api/d4/k8s", { method: "POST" });
      const payload = (await response.json()) as D4K8sRunResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "K8s verify failed");

      setRunResult(payload);
      if (payload.dryRunLog) setDryRunLog(payload.dryRunLog);
      if (payload.applyLog) setApplyLog(payload.applyLog);
      if (payload.curlProof) setCurlProof(payload.curlProof);
      setRunState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "Verify exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "K8s verify failed");
      setRunState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <p className="eyebrow">Live reviewer demo</p>
        <h2>Kubernetes manifests — kind cluster + curl proof</h2>
        <p className="demo-copy">
          D2 job API deployed on a local <strong>kind</strong> cluster with Deployment, Service,
          ConfigMap, Secret, and optional Ingress. Validates with kubectl dry-run, applies manifests,
          and curls <code>/health</code> and <code>/jobs</code> via port-forward.
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Manifests</strong>
        <ul>
          {D4_MANIFESTS.map((manifest) => (
            <li key={manifest}>
              <code>{manifest}</code>
            </li>
          ))}
        </ul>
        <strong>Commands</strong>
        <ul>
          <li>
            <code>{D4_VERIFY_CMD}</code>
          </li>
          <li>
            <code>{D4_UP_CMD}</code>
          </li>
          <li>
            <code>{D4_DOWN_CMD}</code>
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
          {runState === "running" ? "Running verify…" : "Re-run K8s verify"}
        </button>
      </div>

      {runResult && (
        <p className="scan-status">
          exit {runResult.exitCode}
          {runResult.exitCode === 0 ? " — cluster healthy" : " — see output below"}
        </p>
      )}

      {state === "loading" && <p className="scan-status">Loading D4 K8s artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}
      {runResult?.output && <pre className="artifact-preview">{runResult.output}</pre>}

      {state === "ready" && (
        <>
          <h3>Dry-run (dry-run-output.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{dryRunLog}</pre>

          <h3>Apply (apply-output.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{applyLog}</pre>

          <h3>Curl proof (curl-proof.txt)</h3>
          <pre className="artifact-preview diagram-preview-full">{curlProof}</pre>
        </>
      )}
    </section>
  );
}
