import { FormEvent, useEffect, useState } from "react";
import {
  B5_SERVICE_BASE,
  formatLedgerBalance,
  type Balance,
  type Transaction,
  type TransactionCreatePayload,
  type VitestRunResponse,
} from "../types/ledger";

type RunState = "idle" | "loading" | "done" | "error";

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json()) as T & { error?: string };
}

export function B5NodeApiDemo() {
  const [amount, setAmount] = useState("100.00");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [description, setDescription] = useState("Reviewer demo deposit");
  const [apiState, setApiState] = useState<RunState>("idle");
  const [testState, setTestState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [testResult, setTestResult] = useState<VitestRunResponse | null>(null);
  const [savedProof, setSavedProof] = useState<string | null>(null);

  async function refreshLedger() {
    const [txResponse, balanceResponse] = await Promise.all([
      fetch(`${B5_SERVICE_BASE}/transactions`),
      fetch(`${B5_SERVICE_BASE}/balance`),
    ]);

    const txPayload = await readJson<Transaction[]>(txResponse);
    const balancePayload = await readJson<Balance>(balanceResponse);

    if (!txResponse.ok) throw new Error(txPayload.error || "Failed to load transactions");
    if (!balanceResponse.ok) throw new Error(balancePayload.error || "Failed to load balance");

    setTransactions(txPayload);
    setBalance(balancePayload);
  }

  async function ensureService() {
    setApiState("loading");
    setError(null);
    try {
      const response = await fetch(`${B5_SERVICE_BASE}/health`);
      const payload = await readJson<{ status: string }>(response);
      if (!response.ok) throw new Error(payload.error || "Node.js API health check failed");
      await refreshLedger();
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Node.js API unavailable");
      setApiState("error");
    }
  }

  useEffect(() => {
    void fetch("/tasks/b5-nodejs-greenfield-api-or-cli/artifacts/run-proof.txt")
      .then((response) => (response.ok ? response.text() : null))
      .then(setSavedProof);
    void ensureService();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setApiState("loading");
    setError(null);

    try {
      const payload: TransactionCreatePayload = {
        amount,
        type,
        description: description.trim() || undefined,
      };
      const response = await fetch(`${B5_SERVICE_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJson<Transaction>(response);
      if (!response.ok) throw new Error(body.error || "Failed to create transaction");
      await refreshLedger();
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setApiState("error");
    }
  }

  async function resetLedger() {
    setApiState("loading");
    setError(null);
    try {
      const response = await fetch(`${B5_SERVICE_BASE}/reset`, { method: "POST" });
      const payload = await readJson<{ status: string }>(response);
      if (!response.ok) throw new Error(payload.error || "Reset failed");
      await refreshLedger();
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
      setApiState("error");
    }
  }

  async function runVitest() {
    setTestState("loading");
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch("/api/b5/run-tests", { method: "POST" });
      const payload = await readJson<VitestRunResponse>(response);
      if (!response.ok) throw new Error(payload.error || "Vitest run failed");
      setTestResult(payload);
      if (payload.savedProof) setSavedProof(payload.savedProof);
      setTestState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vitest run failed");
      setTestState("error");
    }
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h2>Node.js Express transaction ledger</h2>
          <p className="demo-copy">
            Same B4 domain implemented with Express + Zod. Starts the B5 API on demand, exercises{" "}
            <code>/transactions</code> and <code>/balance</code>, and runs the Vitest suite live.
          </p>
        </div>
      </div>

      <div className="demo-repo-list">
        <strong>Prerequisites</strong>
        <ul>
          <li>
            <code>cd tasks/b5-nodejs-greenfield-api-or-cli && npm install</code>
          </li>
          <li>
            Service proxies through <code>{B5_SERVICE_BASE}</code> while <code>npm run dev</code> is running
          </li>
        </ul>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void runVitest()}
          disabled={testState === "loading"}
        >
          {testState === "loading" ? "Running Vitest…" : "Run Vitest suite"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void ensureService()}
          disabled={apiState === "loading"}
        >
          Refresh API state
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void resetLedger()}
          disabled={apiState === "loading"}
        >
          Reset ledger
        </button>
      </div>

      {testState === "loading" && (
        <div className="scan-status">Running Vitest in tasks/b5-nodejs-greenfield-api-or-cli…</div>
      )}

      {error && <div className="scan-error">{error}</div>}

      {testResult && (
        <>
          <div className="scan-meta">
            <p>
              <strong>Vitest:</strong>{" "}
              <span
                className={
                  testResult.summary.passed ? "status-pill status-done" : "status-pill status-pending"
                }
              >
                {testResult.summary.testsPassed ?? 0} passed
                {testResult.summary.durationMs != null
                  ? ` (${(testResult.summary.durationMs / 1000).toFixed(2)}s)`
                  : ""}
              </span>
            </p>
          </div>
          <div className="artifact-header">
            <h3>Live Vitest output</h3>
          </div>
          <pre className="artifact-preview">{testResult.output}</pre>
        </>
      )}

      {balance && (
        <div className="summary-grid">
          <div className="summary-card">
            <strong>{formatLedgerBalance(balance)}</strong>
            <span>Current balance</span>
          </div>
          <div className="summary-card">
            <strong>{transactions.length}</strong>
            <span>Transactions</span>
          </div>
          <div className="summary-card">
            <strong>{apiState === "done" ? "up" : "…"}</strong>
            <span>Express API</span>
          </div>
        </div>
      )}

      <form className="scan-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Amount</span>
          <input
            type="text"
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="100.00"
            disabled={apiState === "loading"}
          />
        </label>

        <label className="field">
          <span>Type</span>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as "credit" | "debit")}
            disabled={apiState === "loading"}
          >
            <option value="credit">credit</option>
            <option value="debit">debit</option>
          </select>
        </label>

        <label className="field">
          <span>Description</span>
          <input
            type="text"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional note"
            disabled={apiState === "loading"}
          />
        </label>

        <div className="scan-actions">
          <button type="submit" className="btn btn-primary" disabled={apiState === "loading"}>
            POST /transactions
          </button>
        </div>
      </form>

      {transactions.length > 0 && (
        <>
          <div className="artifact-header">
            <h3>GET /transactions</h3>
          </div>
          <div className="test-file-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td>{tx.type}</td>
                    <td>{tx.amount}</td>
                    <td>{tx.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {savedProof && !testResult && (
        <>
          <div className="artifact-header">
            <h3>Saved run proof</h3>
            <code>tasks/b5-nodejs-greenfield-api-or-cli/artifacts/run-proof.txt</code>
          </div>
          <pre className="artifact-preview">{savedProof}</pre>
        </>
      )}
    </section>
  );
}
