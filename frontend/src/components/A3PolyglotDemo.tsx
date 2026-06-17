import { FormEvent, useEffect, useState } from "react";
import {
  A3_DEFAULT_EVENT,
  A3_SERVICE_BASE,
  A3_TASK_SLUG,
  type A3EventAccepted,
  type A3LayerTestResponse,
  type A3ScoreRecord,
  type A3SmokeResponse,
} from "../types/a3Fraud";

type RunState = "idle" | "loading" | "done" | "error";

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json()) as T & { error?: string };
}

export function A3PolyglotDemo() {
  const [transactionId, setTransactionId] = useState(A3_DEFAULT_EVENT.transaction_id);
  const [amount, setAmount] = useState(String(A3_DEFAULT_EVENT.amount));
  const [merchantId, setMerchantId] = useState(A3_DEFAULT_EVENT.merchant_id);
  const [apiState, setApiState] = useState<RunState>("idle");
  const [engineTestState, setEngineTestState] = useState<RunState>("idle");
  const [workerTestState, setWorkerTestState] = useState<RunState>("idle");
  const [apiTestState, setApiTestState] = useState<RunState>("idle");
  const [smokeState, setSmokeState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<A3EventAccepted | null>(null);
  const [score, setScore] = useState<A3ScoreRecord | null>(null);
  const [engineTests, setEngineTests] = useState<A3LayerTestResponse | null>(null);
  const [workerTests, setWorkerTests] = useState<A3LayerTestResponse | null>(null);
  const [apiTests, setApiTests] = useState<A3LayerTestResponse | null>(null);
  const [smokeResult, setSmokeResult] = useState<A3SmokeResponse | null>(null);
  const [savedProof, setSavedProof] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/${A3_TASK_SLUG}/artifacts/run-proof.txt`)
      .then((response) => (response.ok ? response.text() : null))
      .then(setSavedProof);
  }, []);

  async function ensureService() {
    setApiState("loading");
    setError(null);
    try {
      const response = await fetch(`${A3_SERVICE_BASE}/health`);
      const body = await readJson<{ status: string }>(response);
      if (!response.ok) throw new Error(body.error || "Health check failed");
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "A3 stack unavailable");
      setApiState("error");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setApiState("loading");
    setError(null);
    setAccepted(null);
    setScore(null);

    const payload = {
      transaction_id: transactionId,
      amount: Number(amount),
      merchant_id: merchantId,
    };

    try {
      const eventResponse = await fetch(`${A3_SERVICE_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const eventBody = await readJson<A3EventAccepted>(eventResponse);
      if (!eventResponse.ok) throw new Error(eventBody.error || "Event ingest failed");
      setAccepted(eventBody);

      const scoreResponse = await fetch(`${A3_SERVICE_BASE}/scores/${encodeURIComponent(transactionId)}`);
      const scoreBody = await readJson<A3ScoreRecord>(scoreResponse);
      if (!scoreResponse.ok) throw new Error(scoreBody.error || "Score fetch failed");
      setScore(scoreBody);
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
      setApiState("error");
    }
  }

  async function runLayerTests(
    endpoint: string,
    setState: (state: RunState) => void,
    setResult: (result: A3LayerTestResponse | null) => void,
  ) {
    setState("loading");
    setError(null);
    setResult(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const payload = await readJson<A3LayerTestResponse>(response);
      if (!response.ok) throw new Error(payload.error || "Layer tests failed");
      setResult(payload);
      setState(payload.exitCode === 0 ? "done" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Layer tests failed");
      setState("error");
    }
  }

  async function runSmoke() {
    setSmokeState("loading");
    setError(null);
    setSmokeResult(null);
    try {
      const response = await fetch("/api/a3/smoke", { method: "POST" });
      const payload = await readJson<A3SmokeResponse>(response);
      if (!response.ok) throw new Error(payload.error || "Smoke test failed");
      setSmokeResult(payload);
      setSmokeState(payload.exitCode === 0 ? "done" : "error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Smoke test failed");
      setSmokeState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>Live demo — FastAPI + Node worker + Rust engine</h2>
        <p className="demo-copy">
          Polyglot fraud-score pipeline on ports 8780 (API), 8781 (worker), and 8782 (Rust engine).
          Submit an event and fetch the computed score through the full stack.
        </p>
      </div>

      <form className="scan-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="field">
          <span>Transaction ID</span>
          <input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} required />
        </div>
        <div className="field">
          <span>Amount</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <div className="field">
          <span>Merchant ID</span>
          <input value={merchantId} onChange={(event) => setMerchantId(event.target.value)} required />
        </div>
        <div className="scan-actions">
          <button type="button" className="btn btn-secondary" disabled={apiState === "loading"} onClick={() => void ensureService()}>
            Check stack health
          </button>
          <button type="submit" className="btn btn-primary" disabled={apiState === "loading"}>
            Score transaction
          </button>
          <button type="button" className="btn btn-secondary" disabled={smokeState === "loading"} onClick={() => void runSmoke()}>
            Run E2E smoke
          </button>
          <button type="button" className="btn btn-secondary" disabled={engineTestState === "loading"} onClick={() => void runLayerTests("/api/a3/run-engine-tests", setEngineTestState, setEngineTests)}>
            Rust tests
          </button>
          <button type="button" className="btn btn-secondary" disabled={workerTestState === "loading"} onClick={() => void runLayerTests("/api/a3/run-worker-tests", setWorkerTestState, setWorkerTests)}>
            Worker tests
          </button>
          <button type="button" className="btn btn-secondary" disabled={apiTestState === "loading"} onClick={() => void runLayerTests("/api/a3/run-api-tests", setApiTestState, setApiTests)}>
            API tests
          </button>
        </div>
      </form>

      {apiState === "loading" && <p className="scan-status">Starting A3 polyglot stack…</p>}
      {error && <p className="scan-error">{error}</p>}
      {accepted && <p className="scan-status">Accepted: {accepted.transaction_id} ({accepted.status})</p>}
      {score && (
        <pre className="artifact-preview">
          {JSON.stringify(score, null, 2)}
        </pre>
      )}

      {smokeResult && (
        <>
          <h3>E2E smoke steps</h3>
          <pre className="artifact-preview">{JSON.stringify(smokeResult.steps, null, 2)}</pre>
        </>
      )}

      {engineTests && (
        <>
          <h3>Rust cargo test output</h3>
          <pre className="artifact-preview">{engineTests.output}</pre>
        </>
      )}

      {workerTests && (
        <>
          <h3>Worker vitest output</h3>
          <pre className="artifact-preview">{workerTests.output}</pre>
        </>
      )}

      {apiTests && (
        <>
          <h3>API pytest output</h3>
          <pre className="artifact-preview">{apiTests.output}</pre>
        </>
      )}

      {savedProof && (
        <>
          <h3>Saved run proof</h3>
          <pre className="artifact-preview">{savedProof}</pre>
        </>
      )}
    </section>
  );
}
