import { FormEvent, useEffect, useState } from "react";
import type { PytestRunResponse } from "../types/ledger";
import {
  A2_ARTIFACT_PATHS,
  A2_ARTIFACT_VIEWS,
  A2_SANDBOX,
  A2_SERVICE_BASE,
  A2_WORKTREE_LANES,
  type A2ArtifactView,
  type A2Balance,
  type A2SmokeResponse,
  type A2Transaction,
  type A2TransactionCreate,
} from "../types/a2Worktree";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json()) as T & { error?: string };
}

export function A2WorktreeDemo() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<A2ArtifactView>("merge");
  const [mergeProof, setMergeProof] = useState("");
  const [laneAOutput, setLaneAOutput] = useState("");
  const [laneBOutput, setLaneBOutput] = useState("");
  const [savedTests, setSavedTests] = useState("");

  const [amount, setAmount] = useState("25.00");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("Reviewer live demo");
  const [apiState, setApiState] = useState<RunState>("idle");
  const [testState, setTestState] = useState<RunState>("idle");
  const [smokeState, setSmokeState] = useState<RunState>("idle");
  const [transactions, setTransactions] = useState<A2Transaction[]>([]);
  const [balance, setBalance] = useState<A2Balance | null>(null);
  const [testResult, setTestResult] = useState<PytestRunResponse | null>(null);
  const [smokeResult, setSmokeResult] = useState<A2SmokeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [mergeRes, laneARes, laneBRes, testsRes] = await Promise.all([
          fetch(`/${A2_ARTIFACT_PATHS.mergeProof}`),
          fetch(`/${A2_ARTIFACT_PATHS.laneA}`),
          fetch(`/${A2_ARTIFACT_PATHS.laneB}`),
          fetch(`/${A2_ARTIFACT_PATHS.finalTests}`),
        ]);

        if (!mergeRes.ok || !laneARes.ok || !laneBRes.ok || !testsRes.ok) {
          throw new Error("Could not load A2 merge proof artifacts");
        }

        const [merge, laneA, laneB, tests] = await Promise.all([
          mergeRes.text(),
          laneARes.text(),
          laneBRes.text(),
          testsRes.text(),
        ]);

        if (cancelled) return;
        setMergeProof(merge);
        setLaneAOutput(laneA);
        setLaneBOutput(laneB);
        setSavedTests(tests);
        setLoadState("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load A2 artifacts");
        setLoadState("error");
      }
    }

    void loadArtifacts();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshLedger() {
    const [txResponse, balanceResponse] = await Promise.all([
      fetch(`${A2_SERVICE_BASE}/transactions`),
      fetch(`${A2_SERVICE_BASE}/balance`),
    ]);

    const txPayload = await readJson<A2Transaction[]>(txResponse);
    const balancePayload = await readJson<A2Balance>(balanceResponse);

    if (!txResponse.ok) throw new Error((txPayload as { error?: string }).error || "Failed to load transactions");
    if (!balanceResponse.ok) {
      throw new Error((balancePayload as { error?: string }).error || "Failed to load balance");
    }

    setTransactions(txPayload);
    setBalance(balancePayload);
  }

  async function ensureService() {
    setApiState("running");
    setError(null);
    try {
      await refreshLedger();
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "A2 API unavailable");
      setApiState("error");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setApiState("running");
    setError(null);

    try {
      const payload: A2TransactionCreate = {
        amount: Number(amount),
        category: category.trim(),
        description: description.trim() || undefined,
      };
      const response = await fetch(`${A2_SERVICE_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJson<A2Transaction>(response);
      if (!response.ok) throw new Error(body.error || "Failed to create transaction");
      await refreshLedger();
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setApiState("error");
    }
  }

  async function runPytest() {
    setTestState("running");
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch("/api/a2/run-tests", { method: "POST" });
      const payload = await readJson<PytestRunResponse>(response);
      if (!response.ok) throw new Error(payload.error || "pytest failed");
      setTestResult(payload);
      setTestState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "pytest failed");
      setTestState("error");
    }
  }

  async function runSmoke() {
    setSmokeState("running");
    setError(null);
    setSmokeResult(null);

    try {
      const response = await fetch("/api/a2/smoke", { method: "POST" });
      const payload = await readJson<A2SmokeResponse>(response);
      if (!response.ok) throw new Error(payload.error || "Smoke test failed");
      setSmokeResult(payload);
      await refreshLedger();
      setSmokeState("done");
      setApiState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Smoke test failed");
      setSmokeState("error");
    }
  }

  const artifactText =
    view === "merge"
      ? mergeProof
      : view === "laneA"
        ? laneAOutput
        : view === "laneB"
          ? laneBOutput
          : savedTests;

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>Live demo — two parallel worktrees</h2>
        <p className="demo-copy">
          Merged Expense Tracker from lanes <code>feat/a2-data-layer</code> and{" "}
          <code>feat/a2-api-endpoints</code>. Sandbox: <code>{A2_SANDBOX}</code>.
          Run pytest or smoke the API against this eval repo only.
        </p>
      </div>

      <h3>Worktree lanes (executed in sandbox)</h3>
      <div className="entity-table-wrap">
        <table className="entity-table">
          <thead>
            <tr>
              <th>Lane</th>
              <th>Branch</th>
              <th>Worktree</th>
              <th>Owns</th>
            </tr>
          </thead>
          <tbody>
            {A2_WORKTREE_LANES.map((lane) => (
              <tr key={lane.branch}>
                <td>{lane.lane}</td>
                <td>
                  <code>{lane.branch}</code>
                </td>
                <td>
                  <code>{lane.worktree}</code>
                </td>
                <td>{lane.owns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={testState === "running"}
          onClick={() => void runPytest()}
        >
          {testState === "running" ? "Running pytest…" : "Run merged sandbox tests"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={smokeState === "running"}
          onClick={() => void runSmoke()}
        >
          {smokeState === "running" ? "Running smoke…" : "Run curl smoke (3 endpoints)"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => void ensureService()}>
          Refresh ledger
        </button>
      </div>

      {testState === "done" && testResult && (
        <>
          <p className="scan-status">
            pytest: {testResult.summary.testsPassed ?? "?"} passed
            {testResult.summary.durationMs ? ` in ${testResult.summary.durationMs}ms` : ""}
          </p>
          <pre className="artifact-preview">{testResult.output}</pre>
        </>
      )}

      {smokeState === "done" && smokeResult && (
        <pre className="artifact-preview">{JSON.stringify(smokeResult, null, 2)}</pre>
      )}

      <h3>Live API — merged sandbox</h3>
      <form className="scan-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Amount
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          Category
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
        <label>
          Description
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={apiState === "running"}>
          POST /transactions
        </button>
      </form>

      {balance && (
        <p className="scan-status">
          Balance: <strong>{balance.balance}</strong> · Transactions: {transactions.length}
        </p>
      )}

      {transactions.length > 0 && (
        <pre className="artifact-preview">{JSON.stringify(transactions, null, 2)}</pre>
      )}

      {loadState === "loading" && <p className="scan-status">Loading merge proof artifacts…</p>}
      {loadState === "error" && error && <p className="scan-error">{error}</p>}

      {loadState === "ready" && (
        <>
          <h3>Merge proof artifacts</h3>
          <div className="view-toggle" role="tablist" aria-label="A2 artifact view">
            {A2_ARTIFACT_VIEWS.map((option) => (
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
          <pre className="artifact-preview diagram-preview-full">{artifactText}</pre>
        </>
      )}
    </section>
  );
}
