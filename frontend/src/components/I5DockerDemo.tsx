import { useEffect, useState } from "react";
import {
  I5_ARTIFACT_PATHS,
  I5_COMPOSE_UP_CMD,
  I5_DOCKER_BUILD_CMD,
  I5_DOCKER_IMAGE,
  I5_DOCKERFILE_CHECKS,
  I5_SERVICE_PORT,
  type I5ScriptRunResponse,
} from "../types/i5Docker";

type LoadState = "loading" | "ready" | "error";
type RunState = "idle" | "running" | "done" | "error";

export function I5DockerDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [runState, setRunState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dockerfile, setDockerfile] = useState("");
  const [buildProof, setBuildProof] = useState("");
  const [curlProof, setCurlProof] = useState("");
  const [runResult, setRunResult] = useState<I5ScriptRunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [dockerfileRes, buildRes, curlRes] = await Promise.all([
          fetch(`/${I5_ARTIFACT_PATHS.dockerfile}`),
          fetch(`/${I5_ARTIFACT_PATHS.buildProof}`),
          fetch(`/${I5_ARTIFACT_PATHS.curlProof}`),
        ]);

        if (!dockerfileRes.ok || !buildRes.ok || !curlRes.ok) {
          throw new Error("Could not load I5 artifacts");
        }

        const [dockerfileText, buildText, curlText] = await Promise.all([
          dockerfileRes.text(),
          buildRes.text(),
          curlRes.text(),
        ]);

        if (cancelled) return;
        setDockerfile(dockerfileText);
        setBuildProof(buildText);
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

  async function runVerification(useSmokeOnly = false) {
    setRunState("running");
    setError(null);
    setRunResult(null);

    try {
      const endpoint = useSmokeOnly ? "/api/i5/smoke-local" : "/api/i5/verify-docker";
      const response = await fetch(endpoint, { method: "POST" });
      const payload = (await response.json()) as I5ScriptRunResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Verification failed");
      setRunResult(payload);
      if (payload.savedBuildProof) setBuildProof(payload.savedBuildProof);
      if (payload.savedCurlProof) setCurlProof(payload.savedCurlProof);
      setRunState(payload.exitCode === 0 ? "done" : "error");
      if (payload.exitCode !== 0) {
        setError(payload.output || "Verification exited with error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setRunState("error");
    }
  }

  const dockerfileChecks = I5_DOCKERFILE_CHECKS.map((check) => ({
    check,
    pass: dockerfile.includes(check),
  }));

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>Live demo — Dockerize and run</h2>
        <p className="demo-copy">
          Containerizes the I4 convert FastAPI service as <code>{I5_DOCKER_IMAGE}</code> on port{" "}
          <code>{I5_SERVICE_PORT}</code> with Dockerfile HEALTHCHECK and curl proof.
        </p>
      </div>

      <div className="demo-repo-list">
        <strong>Commands</strong>
        <ul>
          <li>
            <code>{I5_DOCKER_BUILD_CMD}</code>
          </li>
          <li>
            <code>{I5_COMPOSE_UP_CMD}</code>
          </li>
          <li>
            <code>curl -fsS http://127.0.0.1:{I5_SERVICE_PORT}/health</code>
          </li>
        </ul>
      </div>

      {state === "ready" && (
        <div className="entity-table-wrap">
          <table className="entity-table">
            <thead>
              <tr>
                <th>Dockerfile check</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dockerfileChecks.map((row) => (
                <tr key={row.check}>
                  <td>
                    <code>{row.check}</code>
                  </td>
                  <td>{row.pass ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="scan-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={runState === "running"}
          onClick={() => void runVerification(false)}
        >
          {runState === "running" ? "Running…" : "Run Docker verify (or local smoke)"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={runState === "running"}
          onClick={() => void runVerification(true)}
        >
          Local smoke only
        </button>
        <a className="btn btn-secondary" href={`/${I5_ARTIFACT_PATHS.dockerfile}`} target="_blank" rel="noreferrer">
          Open Dockerfile
        </a>
      </div>

      {runResult && (
        <p className="scan-status">
          Mode: <code>{runResult.mode}</code> · exit {runResult.exitCode}
        </p>
      )}

      {state === "loading" && <p className="scan-status">Loading I5 artifacts…</p>}
      {error && <p className="scan-error">{error}</p>}
      {runResult?.output && <pre className="artifact-preview">{runResult.output}</pre>}

      {state === "ready" && (
        <>
          <h3>Dockerfile</h3>
          <pre className="artifact-preview diagram-preview-full">{dockerfile}</pre>

          <h3>Build proof</h3>
          <pre className="artifact-preview diagram-preview-full">{buildProof}</pre>

          <h3>Curl / health proof</h3>
          <pre className="artifact-preview diagram-preview-full">{curlProof}</pre>
        </>
      )}
    </section>
  );
}
