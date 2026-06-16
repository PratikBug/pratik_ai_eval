import { FormEvent, useState } from "react";
import {
  CATEGORY_LABELS,
  INVENTORY_CATEGORIES,
  type InventoryScanResponse,
} from "../types/inventory";
import { B1_EXAMPLE_REPO_URL, PUBLIC_BITBUCKET_DEMO_REPOS, validateBitbucketRepoUrl } from "../lib/bitbucketUrl";

type ScanState = "idle" | "scanning" | "done" | "error";

export function B1InventoryDemo() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InventoryScanResponse | null>(null);

  async function runScan(event: FormEvent) {
    event.preventDefault();

    const validationError = validateBitbucketRepoUrl(repoUrl);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    setState("scanning");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/b1/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          branch: branch.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as InventoryScanResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Scan request failed");
      }

      setResult(payload);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setState("error");
    }
  }

  function useExampleUrl() {
    setRepoUrl(B1_EXAMPLE_REPO_URL);
    setBranch("master");
    setError(null);
    setState("idle");
  }

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h2>Scan a Bitbucket repository</h2>
          <p className="demo-copy">
            Paste a public Bitbucket link, run the inventory scanner, and review classes, services,
            controllers, configs, and other artifacts in the browser. Private repos such as{" "}
            <code>paytmmoney/pml-equity-hybrid</code> require Bitbucket credentials on this machine.
          </p>
        </div>
      </div>

      <div className="demo-repo-list">
        <strong>Verified public demo repos</strong>
        <ul>
          {PUBLIC_BITBUCKET_DEMO_REPOS.map((repo) => (
            <li key={repo.url}>
              {repo.label} — <code>{repo.url}</code>
            </li>
          ))}
        </ul>
      </div>

      <form className="scan-form" onSubmit={(event) => void runScan(event)}>
        <label className="field">
          <span>Bitbucket repository URL</span>
          <input
            type="url"
            name="repoUrl"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder={B1_EXAMPLE_REPO_URL}
            autoComplete="off"
            disabled={state === "scanning"}
          />
        </label>

        <label className="field">
          <span>Branch override (optional)</span>
          <input
            type="text"
            name="branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            placeholder="master"
            autoComplete="off"
            disabled={state === "scanning"}
          />
        </label>

        <div className="scan-actions">
          <button type="submit" className="btn btn-primary" disabled={state === "scanning"}>
            {state === "scanning" ? "Scanning repository…" : "Run inventory scan"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={useExampleUrl}
            disabled={state === "scanning"}
          >
            Use example URL
          </button>
        </div>
      </form>

      {state === "scanning" && (
        <div className="scan-status">
          Cloning repository and scanning artifacts. Private repos require git credentials on
          this machine.
        </div>
      )}

      {error && <div className="scan-error">{error}</div>}

      {result && (
        <>
          <div className="scan-meta">
            <p>
              <strong>Source:</strong> <code>{result.inventory.source_url}</code>
            </p>
            {result.inventory.branch && (
              <p>
                <strong>Branch:</strong> <code>{result.inventory.branch}</code>
              </p>
            )}
            <p>
              <strong>Files scanned:</strong> {result.inventory.files_scanned}
            </p>
          </div>

          <div className="summary-grid">
            {INVENTORY_CATEGORIES.map((category) => (
              <div key={category} className="summary-card">
                <strong>{result.summary[category] ?? 0}</strong>
                <span>{CATEGORY_LABELS[category]}</span>
              </div>
            ))}
          </div>

          <div className="artifact-header">
            <h3>Inventory report</h3>
          </div>
          <pre className="artifact-preview">{result.report}</pre>
        </>
      )}
    </section>
  );
}
