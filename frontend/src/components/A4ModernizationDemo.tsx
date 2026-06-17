import { useEffect, useState } from "react";
import {
  A4_MODERNIZATION_PLAN_PATH,
  A4_SERVICE_BASE,
  type A4PlanResponse,
  type A4VerifyResponse,
} from "../types/a4Modernization";

type LoadState = "idle" | "loading" | "done" | "error";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}

export function A4ModernizationDemo() {
  const [planState, setPlanState] = useState<LoadState>("idle");
  const [verifyState, setVerifyState] = useState<LoadState>("idle");
  const [healthState, setHealthState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<A4PlanResponse | null>(null);
  const [verifyResult, setVerifyResult] = useState<A4VerifyResponse | null>(null);
  const [healthProbe, setHealthProbe] = useState<string | null>(null);

  useEffect(() => {
    void loadPlan();
  }, []);

  async function loadPlan() {
    setPlanState("loading");
    setError(null);
    try {
      const response = await fetch(`${A4_SERVICE_BASE}/plan`);
      const payload = await readJson<A4PlanResponse>(response);
      setPlan(payload);
      setPlanState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
      setPlanState("error");
    }
  }

  async function runVerify() {
    setVerifyState("loading");
    setError(null);
    setVerifyResult(null);
    try {
      const response = await fetch(`${A4_SERVICE_BASE}/verify`, { method: "POST" });
      const payload = await readJson<A4VerifyResponse>(response);
      setVerifyResult(payload);
      setVerifyState(payload.passed ? "done" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setVerifyState("error");
    }
  }

  async function probeHealth() {
    setHealthState("loading");
    setError(null);
    setHealthProbe(null);
    try {
      const response = await fetch(`${A4_SERVICE_BASE}/sandbox-health`);
      const payload = await readJson<{ ok: boolean; probe: string }>(response);
      setHealthProbe(payload.probe);
      setHealthState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health probe failed");
      setHealthState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h3>A4 — Repository modernization</h3>
          <p className="muted">
            Loads <code>{A4_MODERNIZATION_PLAN_PATH}</code>, probes the legacy sandbox{" "}
            <code>/health</code> endpoint, and re-runs pytest verification.
          </p>
        </div>
      </div>

      <div className="demo-actions">
        <button type="button" onClick={() => void loadPlan()} disabled={planState === "loading"}>
          Reload plan
        </button>
        <button type="button" onClick={() => void probeHealth()} disabled={healthState === "loading"}>
          Probe /health
        </button>
        <button type="button" onClick={() => void runVerify()} disabled={verifyState === "loading"}>
          Run pytest verify
        </button>
      </div>

      {planState === "loading" && <p className="scan-status">Loading modernization plan…</p>}
      {plan?.summary && (
        <div className="scan-summary">
          <p>
            <strong>First step:</strong> {plan.summary.firstStep}
          </p>
          <p>
            <strong>Findings:</strong> {plan.summary.findingsCount} · <strong>Backlog items:</strong>{" "}
            {plan.summary.backlogItems}
          </p>
        </div>
      )}

      {healthState === "loading" && <p className="scan-status">Probing legacy sandbox health…</p>}
      {healthProbe && (
        <p className="scan-status">
          Sandbox health: <code>{healthProbe}</code>
        </p>
      )}

      {verifyState === "loading" && <p className="scan-status">Running pytest verification…</p>}
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

      {plan?.plan && (
        <details className="scan-details">
          <summary>Full modernization plan</summary>
          <pre className="scan-output">{plan.plan}</pre>
        </details>
      )}
    </section>
  );
}
