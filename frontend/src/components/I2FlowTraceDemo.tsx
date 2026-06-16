import { useEffect, useState } from "react";
import { MermaidDiagram } from "./MermaidDiagram";
import {
  buildMermaidLiveUrl,
  I2_ARTIFACT_PATHS,
  I2_EXTERNAL_DEPS,
  I2_FLOW_STEPS,
  I2_FLOW_TRACE_VIEWS,
  I2_SIDE_EFFECTS,
  I2_TRACE_TARGET,
  I2_UNCERTAINTIES,
  type I2FlowTraceView,
} from "../types/i2FlowTrace";

type LoadState = "loading" | "ready" | "error";

export function I2FlowTraceDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [flowTraceMd, setFlowTraceMd] = useState<string>("");
  const [diagramSource, setDiagramSource] = useState<string>("");
  const [view, setView] = useState<I2FlowTraceView>("rendered");

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [traceRes, diagramRes] = await Promise.all([
          fetch(`/${I2_ARTIFACT_PATHS.flowTrace}`),
          fetch(`/${I2_ARTIFACT_PATHS.sequenceDiagram}`),
        ]);

        if (!traceRes.ok || !diagramRes.ok) {
          throw new Error("Could not load I2 artifacts");
        }

        const [traceText, diagramText] = await Promise.all([
          traceRes.text(),
          diagramRes.text(),
        ]);

        if (cancelled) return;
        setFlowTraceMd(traceText);
        setDiagramSource(diagramText);
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

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>Live demo — end-to-end flow trace</h2>
        <p className="demo-copy">
          Traced flow: <code>{I2_TRACE_TARGET.method} {I2_TRACE_TARGET.path}</code> on{" "}
          {I2_TRACE_TARGET.service}. Entry at{" "}
          <code>{I2_TRACE_TARGET.entryFunction}()</code> ({I2_TRACE_TARGET.entryFile}:
          {I2_TRACE_TARGET.entryLines}).
        </p>
      </div>

      <h3>Step-by-step path</h3>
      <div className="entity-table-wrap">
        <table className="entity-table flow-step-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Layer</th>
              <th>File</th>
              <th>Function</th>
              <th>Lines</th>
              <th>Action</th>
              <th>Side effect</th>
            </tr>
          </thead>
          <tbody>
            {I2_FLOW_STEPS.map((step) => (
              <tr key={step.step}>
                <td>{step.step}</td>
                <td>{step.layer}</td>
                <td>
                  <code>{step.file}</code>
                </td>
                <td>
                  <code>{step.function}</code>
                </td>
                <td>{step.lines}</td>
                <td>{step.action}</td>
                <td>{step.sideEffect ? "Yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="demo-two-col">
        <div>
          <h3>External dependencies</h3>
          <ul className="runtime-list">
            {I2_EXTERNAL_DEPS.map((dep) => (
              <li key={dep}>{dep}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Side effects</h3>
          <ul className="runtime-list">
            {I2_SIDE_EFFECTS.map((effect) => (
              <li key={effect.type}>
                <strong>{effect.type}:</strong> {effect.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3>Known uncertainty</h3>
      <ul className="runtime-list uncertainty-list">
        {I2_UNCERTAINTIES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {state === "loading" && <p className="scan-status">Loading flow trace artifacts…</p>}
      {state === "error" && error && <p className="scan-error">{error}</p>}

      {state === "ready" && (
        <>
          <div className="view-toggle" role="tablist" aria-label="Flow trace view">
            {I2_FLOW_TRACE_VIEWS.map((option) => (
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

          <div className="scan-actions">
            <a
              className="btn btn-primary"
              href={buildMermaidLiveUrl(diagramSource)}
              target="_blank"
              rel="noreferrer"
            >
              Open sequence in Mermaid Live
            </a>
            <a
              className="btn btn-secondary"
              href={`/${I2_ARTIFACT_PATHS.flowTrace}`}
              target="_blank"
              rel="noreferrer"
            >
              Open flow-trace.md
            </a>
            <a className="btn btn-secondary" href="/tasks/B4">
              Try live B4 API demo
            </a>
          </div>

          {view === "rendered" && (
            <div role="tabpanel">
              <h3>Sequence diagram</h3>
              <MermaidDiagram source={diagramSource} />
            </div>
          )}

          {view === "source" && (
            <div role="tabpanel">
              <h3>Mermaid source</h3>
              <pre className="artifact-preview diagram-preview-full">{diagramSource}</pre>
            </div>
          )}

          {view === "trace" && (
            <div role="tabpanel">
              <h3>Full flow trace</h3>
              <pre className="artifact-preview diagram-preview-full">{flowTraceMd}</pre>
            </div>
          )}
        </>
      )}
    </section>
  );
}
