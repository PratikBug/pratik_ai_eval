import { Link } from "react-router-dom";
import { getTaskArchitecture } from "../pages/taskArchitectures";
import type { Task } from "../types/tasks";

interface PendingTaskDemoProps {
  task: Task;
}

export function PendingTaskDemo({ task }: PendingTaskDemoProps) {
  const architecture = getTaskArchitecture(task.id);
  const isPending = task.status === "pending";

  return (
    <section className="panel b1-demo-panel">
      <div className="b1-demo-header">
        <h2>{isPending ? "Task preview" : "Task overview demo"}</h2>
        <p className="demo-copy">
          {isPending
            ? "This task is not implemented yet. Review the planned architecture, expected deliverables, and README before starting work."
            : "Architecture and deliverable overview for this task."}
        </p>
      </div>

      <div className={`demo-status-banner status-${task.status}`}>
        <strong>Status:</strong> {task.status.replace("_", " ")}
        <span> · Time box: {task.timeBox}</span>
      </div>

      {architecture ? (
        <>
          <p className="section-copy">{architecture.overview}</p>

          <h3>{isPending ? "Planned pipeline" : "Pipeline"}</h3>
          <div className="flow-chart flow-chart-compact" aria-label={`${task.id} pipeline`}>
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

          <h3>Expected deliverables</h3>
          <ol className="deliverable-list">
            {architecture.flowSteps.map((step) => (
              <li key={step.id}>
                <strong>{step.title}</strong>
                <span>{step.summary}</span>
                <code>{step.file}</code>
              </li>
            ))}
          </ol>

          {architecture.runtimeRequirements.length > 0 && (
            <>
              <h3>Runtime requirements</h3>
              <ul className="runtime-list">
                {architecture.runtimeRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </>
          )}

          <div className="scan-actions">
            <Link to={`/how-it-works/${task.id}`} className="btn btn-primary">
              Full architecture page
            </Link>
            <a className="btn btn-secondary" href={`/${task.readmePath}`} target="_blank" rel="noreferrer">
              Open README
            </a>
          </div>
        </>
      ) : (
        <>
          <p className="section-copy">{task.summary}</p>
          <div className="scan-actions">
            <a className="btn btn-primary" href={`/${task.readmePath}`} target="_blank" rel="noreferrer">
              Open README
            </a>
          </div>
        </>
      )}
    </section>
  );
}
