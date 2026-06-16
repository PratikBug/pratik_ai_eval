import { Link } from "react-router-dom";
import type { TaskArchitecture } from "../pages/taskArchitectures";

interface TaskArchitectureViewProps {
  architecture: TaskArchitecture;
  backTo: string;
  backLabel: string;
  taskDetailPath?: string;
}

export function TaskArchitectureView({
  architecture,
  backTo,
  backLabel,
  taskDetailPath,
}: TaskArchitectureViewProps) {
  const statusLabel = architecture.status === "done" ? "Implemented" : "Planned";

  return (
    <div className="page how-it-works-page">
      <Link to={backTo} className="back-link">
        {backLabel}
      </Link>

      <section className="panel how-hero">
        <div className="detail-top">
          <span className="task-id">{architecture.taskId}</span>
          <span className={`status-pill status-${architecture.status}`}>{statusLabel}</span>
        </div>
        <p className="eyebrow">Task architecture</p>
        <h1>{architecture.title}</h1>
        <p className="hero-copy">{architecture.overview}</p>
        {taskDetailPath && (
          <div className="task-actions">
            <Link to={taskDetailPath} className="btn btn-primary">
              Open task page
            </Link>
          </div>
        )}
      </section>

      <section className="panel flow-panel">
        <h2>Pipeline diagram</h2>
        <p className="section-copy">
          {architecture.status === "done"
            ? "Implemented flow with source file references below."
            : "Planned architecture — will be updated when the task is completed."}
        </p>

        <div className="flow-chart" aria-label={`${architecture.taskId} pipeline diagram`}>
          {architecture.flowNodes.map((node, index) => (
            <div className="flow-chart-row" key={`${node.label}-${node.step}`}>
              <div className="flow-node">
                <span className="flow-step-badge">Step {node.step}</span>
                <strong>{node.label}</strong>
                <span>{node.sub}</span>
              </div>
              {index < architecture.flowNodes.length - 1 && (
                <div className="flow-arrow" aria-hidden="true">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>

        <h3>Mermaid view</h3>
        <pre className="diagram-code">{architecture.mermaidDiagram}</pre>
      </section>

      <section className="panel steps-panel">
        <h2>Step-by-step detail</h2>
        <ol className="step-list">
          {architecture.flowSteps.map((step) => (
            <li key={step.id} className="step-card">
              <div className="step-card-head">
                <span className="step-number">{step.id}</span>
                <div>
                  <h3>{step.title}</h3>
                  <code>{step.file}</code>
                </div>
              </div>
              <p className="step-summary">{step.summary}</p>
              <p className="step-detail">{step.detail}</p>
              {step.output && (
                <p className="step-output">
                  <strong>Output:</strong> {step.output}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="panel structure-panel">
        <h2>Repository structure</h2>
        <p className="section-copy">Key files and folders for this task.</p>
        <pre className="diagram-code">{architecture.repoStructure}</pre>
      </section>

      <section className="panel requirements-panel">
        <h2>Runtime requirements</h2>
        <ul className="checklist">
          {architecture.runtimeRequirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
