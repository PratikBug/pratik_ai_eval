import { useEffect, useState } from "react";
import { MermaidDiagram } from "./MermaidDiagram";
import {
  buildMermaidLiveUrl,
  I1_ARTIFACT_PATHS,
  I1_ENTITY_STATS,
  I1_ER_DIAGRAM_VIEWS,
  I1_TRANSACTION_FIELDS,
  type I1ErDiagramView,
} from "../types/i1ErDiagram";

type LoadState = "loading" | "ready" | "error";

export function I1ErDiagramDemo() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [entitiesMd, setEntitiesMd] = useState<string>("");
  const [diagramSource, setDiagramSource] = useState<string>("");
  const [view, setView] = useState<I1ErDiagramView>("rendered");

  useEffect(() => {
    let cancelled = false;

    async function loadArtifacts() {
      try {
        const [entitiesRes, diagramRes] = await Promise.all([
          fetch(`/${I1_ARTIFACT_PATHS.entities}`),
          fetch(`/${I1_ARTIFACT_PATHS.diagram}`),
        ]);

        if (!entitiesRes.ok || !diagramRes.ok) {
          throw new Error("Could not load I1 artifacts");
        }

        const [entitiesText, diagramText] = await Promise.all([
          entitiesRes.text(),
          diagramRes.text(),
        ]);

        if (cancelled) return;
        setEntitiesMd(entitiesText);
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
        <h2>Live demo — ER diagram</h2>
        <p className="demo-copy">
          Entity inventory and Mermaid ER diagram for this eval repo. No SQL tables — one
          in-memory <code>Transaction</code> entity from B4/B5.
        </p>
      </div>

      <div className="demo-stats-grid" aria-label="Entity scan summary">
        <div className="demo-stat-card">
          <span className="demo-stat-value">{I1_ENTITY_STATS.sqlTables}</span>
          <span className="demo-stat-label">SQL tables</span>
        </div>
        <div className="demo-stat-card">
          <span className="demo-stat-value">{I1_ENTITY_STATS.ormEntities}</span>
          <span className="demo-stat-label">ORM entities</span>
        </div>
        <div className="demo-stat-card">
          <span className="demo-stat-value">{I1_ENTITY_STATS.logicalEntities}</span>
          <span className="demo-stat-label">Logical entities</span>
        </div>
        <div className="demo-stat-card">
          <span className="demo-stat-value">{I1_ENTITY_STATS.foreignKeys}</span>
          <span className="demo-stat-label">Foreign keys</span>
        </div>
      </div>

      <h3>Transaction entity</h3>
      <div className="entity-table-wrap">
        <table className="entity-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Nullable</th>
              <th>Notes</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {I1_TRANSACTION_FIELDS.map((field) => (
              <tr key={field.name}>
                <td>
                  <code>{field.name}</code>
                </td>
                <td>{field.type}</td>
                <td>{field.nullable ? "Yes" : "No"}</td>
                <td>{field.notes}</td>
                <td>
                  <code>{field.source}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state === "loading" && <p className="scan-status">Loading ER artifacts…</p>}
      {state === "error" && error && <p className="scan-error">{error}</p>}

      {state === "ready" && (
        <>
          <div className="view-toggle" role="tablist" aria-label="ER diagram view">
            {I1_ER_DIAGRAM_VIEWS.map((option) => (
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
              className="btn btn-secondary"
              href={buildMermaidLiveUrl(diagramSource)}
              target="_blank"
              rel="noreferrer"
            >
              Open in Mermaid Live
            </a>
            <a
              className="btn btn-secondary"
              href={`/${I1_ARTIFACT_PATHS.entities}`}
              target="_blank"
              rel="noreferrer"
            >
              Open entities.md
            </a>
            <a
              className="btn btn-secondary"
              href={`/${I1_ARTIFACT_PATHS.diagram}`}
              target="_blank"
              rel="noreferrer"
            >
              Open er-diagram.mmd
            </a>
          </div>

          {view === "rendered" && (
            <div role="tabpanel">
              <h3>Rendered ER diagram</h3>
              <MermaidDiagram source={diagramSource} />
            </div>
          )}

          {view === "source" && (
            <div role="tabpanel">
              <h3>Mermaid source</h3>
              <pre className="artifact-preview diagram-preview-full">{diagramSource}</pre>
            </div>
          )}

          {view === "inventory" && (
            <div role="tabpanel">
              <h3>Full entity inventory</h3>
              <pre className="artifact-preview diagram-preview-full">{entitiesMd}</pre>
            </div>
          )}
        </>
      )}
    </section>
  );
}
