import { FormEvent, useState } from "react";
import {
  ENDPOINT_KIND_LABELS,
  ENDPOINT_ROUTE_KINDS,
  type EndpointScanResponse,
  summarizeEndpointScan,
} from "../types/endpoints";
import { B1_EXAMPLE_REPO_URL, PUBLIC_BITBUCKET_DEMO_REPOS, validateBitbucketRepoUrl } from "../lib/bitbucketUrl";

type ScanState = "idle" | "scanning" | "done" | "error";

export function B2EndpointDemo() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EndpointScanResponse | null>(null);

  async function runScan(options: { useLocalRepo?: boolean } = {}) {
    const useLocalRepo = options.useLocalRepo === true;

    if (!useLocalRepo) {
      const validationError = validateBitbucketRepoUrl(repoUrl);
      if (validationError) {
        setError(validationError);
        setState("error");
        return;
      }
    }

    setState("scanning");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/b2/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: useLocalRepo ? undefined : repoUrl.trim(),
          branch: useLocalRepo ? undefined : branch.trim() || undefined,
          useLocalRepo,
        }),
      });

      const payload = (await response.json()) as EndpointScanResponse & { error?: string };
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runScan();
  }

  function useExampleUrl() {
    setRepoUrl(B1_EXAMPLE_REPO_URL);
    setBranch("master");
    setError(null);
    setState("idle");
  }

  function scanLocalEvalRepo() {
    setError(null);
    setState("idle");
    void runScan({ useLocalRepo: true });
  }

  const summary = result ? summarizeEndpointScan(result) : null;

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <div>
          <p className="eyebrow">Live reviewer demo</p>
          <h2>Map API and frontend routes</h2>
          <p className="demo-copy">
            Paste a Bitbucket link to scan any repository, or scan this eval repo locally to
            verify the B2 endpoint map against our own frontend and Vite middleware routes.
          </p>
        </div>
      </div>

      <div className="demo-repo-list">
        <strong>Try these options</strong>
        <ul>
          <li>
            <strong>Scan this eval repo</strong> — maps routes in{" "}
            <code>pratik_ai_eval</code> (no clone, instant local scan).
          </li>
          {PUBLIC_BITBUCKET_DEMO_REPOS.map((repo) => (
            <li key={repo.url}>
              {repo.label} — <code>{repo.url}</code>
            </li>
          ))}
        </ul>
      </div>

      <form className="scan-form" onSubmit={handleSubmit}>
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
            {state === "scanning" ? "Scanning routes…" : "Run endpoint scan"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={scanLocalEvalRepo}
            disabled={state === "scanning"}
          >
            Scan this eval repo
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
          {repoUrl.trim() && !error
            ? "Cloning repository and scanning routes. Private repos require git credentials on this machine."
            : "Scanning local eval repository for API, middleware, and frontend routes…"}
        </div>
      )}

      {error && <div className="scan-error">{error}</div>}

      {result && summary && (
        <>
          <div className="scan-meta">
            <p>
              <strong>Root:</strong> <code>{result.endpoints.root}</code>
            </p>
            {result.endpoints.source_url && (
              <p>
                <strong>Source:</strong> <code>{result.endpoints.source_url}</code>
              </p>
            )}
            {result.endpoints.branch && (
              <p>
                <strong>Branch:</strong> <code>{result.endpoints.branch}</code>
              </p>
            )}
            <p>
              <strong>Files scanned:</strong> {result.endpoints.files_scanned}
            </p>
          </div>

          <div className="summary-grid">
            {ENDPOINT_ROUTE_KINDS.map((kind) => (
              <div key={kind} className="summary-card">
                <strong>{summary[kind]}</strong>
                <span>{ENDPOINT_KIND_LABELS[kind]}</span>
              </div>
            ))}
          </div>

          <div className="artifact-header">
            <h3>API endpoint map</h3>
          </div>
          <pre className="artifact-preview">{result.apiReport}</pre>

          <div className="artifact-header">
            <h3>Frontend routes</h3>
          </div>
          <pre className="artifact-preview">{result.frontendReport}</pre>
        </>
      )}
    </section>
  );
}
