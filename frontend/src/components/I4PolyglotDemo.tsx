import { FormEvent, useEffect, useState } from "react";
import type { PytestRunResponse } from "../types/ledger";
import {
  formatI4ConvertResult,
  I4_DEFAULT_CONVERT,
  I4_SERVICE_BASE,
  I4_SUPPORTED_CURRENCIES,
  type I4CliRunResponse,
  type I4ConvertRequest,
  type I4ConvertResponse,
  type I4Currency,
  type I4TestRunResponse,
} from "../types/i4Convert";

type RunState = "idle" | "loading" | "done" | "error";

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json()) as T & { error?: string };
}

export function I4PolyglotDemo() {
  const [amount, setAmount] = useState(String(I4_DEFAULT_CONVERT.amount));
  const [fromCurrency, setFromCurrency] = useState<I4Currency>(I4_DEFAULT_CONVERT.from_currency);
  const [toCurrency, setToCurrency] = useState<I4Currency>(I4_DEFAULT_CONVERT.to_currency);
  const [apiState, setApiState] = useState<RunState>("idle");
  const [apiTestState, setApiTestState] = useState<RunState>("idle");
  const [clientTestState, setClientTestState] = useState<RunState>("idle");
  const [cliState, setCliState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [convertResult, setConvertResult] = useState<I4ConvertResponse | null>(null);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [apiTestResult, setApiTestResult] = useState<PytestRunResponse | null>(null);
  const [clientTestResult, setClientTestResult] = useState<I4TestRunResponse | null>(null);
  const [cliOutput, setCliOutput] = useState<string | null>(null);
  const [savedProof, setSavedProof] = useState<string | null>(null);

  async function ensureService() {
    setApiState("loading");
    setError(null);
    try {
      const [healthRes, ratesRes] = await Promise.all([
        fetch(`${I4_SERVICE_BASE}/health`),
        fetch(`${I4_SERVICE_BASE}/rates`),
      ]);
      const health = await readJson<{ status: string }>(healthRes);
      const ratesBody = await readJson<{ rates: Record<string, number> }>(ratesRes);
      if (!healthRes.ok) throw new Error(health.error || "Health check failed");
      if (!ratesRes.ok) throw new Error(ratesBody.error || "Rates fetch failed");
      setRates(ratesBody.rates);
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "I4 API unavailable");
      setApiState("error");
    }
  }

  useEffect(() => {
    void fetch("/tasks/i4-polyglot-service-pair-fastapi-plus-node-client/artifacts/run-proof.txt")
      .then((response) => (response.ok ? response.text() : null))
      .then(setSavedProof);
    void ensureService();
  }, []);

  async function handleConvert(event: FormEvent) {
    event.preventDefault();
    setApiState("loading");
    setError(null);
    setConvertResult(null);

    const payload: I4ConvertRequest = {
      amount: Number(amount),
      from_currency: fromCurrency,
      to_currency: toCurrency,
    };

    try {
      const response = await fetch(`${I4_SERVICE_BASE}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJson<I4ConvertResponse>(response);
      if (!response.ok) throw new Error(body.error || "Convert failed");
      setConvertResult(body);
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Convert failed");
      setApiState("error");
    }
  }

  async function runApiTests() {
    setApiTestState("loading");
    setError(null);
    setApiTestResult(null);
    try {
      const response = await fetch("/api/i4/run-api-tests", { method: "POST" });
      const payload = await readJson<PytestRunResponse>(response);
      if (!response.ok) throw new Error(payload.error || "API tests failed");
      setApiTestResult(payload);
      setApiTestState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "API tests failed");
      setApiTestState("error");
    }
  }

  async function runClientTests() {
    setClientTestState("loading");
    setError(null);
    setClientTestResult(null);
    try {
      const response = await fetch("/api/i4/run-client-tests", { method: "POST" });
      const payload = await readJson<I4TestRunResponse>(response);
      if (!response.ok) throw new Error(payload.error || "Client tests failed");
      setClientTestResult(payload);
      setClientTestState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Client tests failed");
      setClientTestState("error");
    }
  }

  async function runCli() {
    setCliState("loading");
    setError(null);
    setCliOutput(null);
    try {
      const response = await fetch("/api/i4/run-cli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          from_currency: fromCurrency,
          to_currency: toCurrency,
        }),
      });
      const payload = await readJson<I4CliRunResponse>(response);
      if (!response.ok) throw new Error(payload.error || "CLI run failed");
      setCliOutput(payload.output);
      setCliState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "CLI exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "CLI run failed");
      setCliState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>Live demo — FastAPI + Node CLI</h2>
        <p className="demo-copy">
          Polyglot pair: FastAPI <code>POST /convert</code> on port 8768 and Node CLI client. Hardcoded
          USD/EUR/GBP/INR rates with validation on both sides.
        </p>
      </div>

      {rates && (
        <div className="demo-repo-list">
          <strong>Hardcoded rates (USD equivalent per 1 unit)</strong>
          <ul>
            {Object.entries(rates).map(([code, value]) => (
              <li key={code}>
                {code}: {value}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className="scan-form" onSubmit={(event) => void handleConvert(event)}>
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
          <span>From</span>
          <select
            value={fromCurrency}
            onChange={(event) => setFromCurrency(event.target.value as I4Currency)}
          >
            {I4_SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span>To</span>
          <select
            value={toCurrency}
            onChange={(event) => setToCurrency(event.target.value as I4Currency)}
          >
            {I4_SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="scan-actions">
          <button type="submit" className="btn btn-primary" disabled={apiState === "loading"}>
            Convert via API
          </button>
          <button type="button" className="btn btn-secondary" disabled={cliState === "loading"} onClick={() => void runCli()}>
            Run Node CLI
          </button>
          <button type="button" className="btn btn-secondary" disabled={apiTestState === "loading"} onClick={() => void runApiTests()}>
            Run API tests
          </button>
          <button type="button" className="btn btn-secondary" disabled={clientTestState === "loading"} onClick={() => void runClientTests()}>
            Run client tests
          </button>
        </div>
      </form>

      {apiState === "loading" && <p className="scan-status">Contacting I4 FastAPI service…</p>}
      {error && <p className="scan-error">{error}</p>}
      {convertResult && (
        <p className="scan-status">{formatI4ConvertResult(convertResult)}</p>
      )}
      {cliOutput && <pre className="artifact-preview">{cliOutput}</pre>}

      {apiTestResult && (
        <>
          <h3>API pytest output</h3>
          <pre className="artifact-preview">{apiTestResult.output}</pre>
        </>
      )}

      {clientTestResult && (
        <>
          <h3>Client vitest output</h3>
          <pre className="artifact-preview">{clientTestResult.output}</pre>
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
