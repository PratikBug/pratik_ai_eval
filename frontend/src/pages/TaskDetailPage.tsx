import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Task, TasksManifest } from "../types/tasks";
import { findTask } from "../types/tasks";

export function TaskDetailPage() {
  const { taskId = "" } = useParams();
  const [manifest, setManifest] = useState<TasksManifest | null>(null);
  const [artifactPreview, setArtifactPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const task: Task | undefined = manifest ? findTask(manifest, taskId) : undefined;

  useEffect(() => {
    fetch("/tasks.json")
      .then((response) => response.json())
      .then(setManifest)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!task?.demoPath) {
      setArtifactPreview(null);
      return;
    }

    fetch(`/${task.demoPath}`)
      .then((response) => {
        if (!response.ok) throw new Error("Artifact not found");
        return response.text();
      })
      .then(setArtifactPreview)
      .catch(() => setArtifactPreview(null));
  }, [task]);

  if (error) return <div className="panel error-panel">Error: {error}</div>;
  if (!manifest) return <div className="panel loading-panel">Loading…</div>;
  if (!task) {
    return (
      <div className="panel error-panel">
        Task <code>{taskId}</code> not found. <Link to="/">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="page detail-page">
      <Link to="/" className="back-link">
        ← All tasks
      </Link>

      <section className="panel detail-hero">
        <div className="detail-top">
          <span className="task-id">{task.id}</span>
          <span className={`status-pill status-${task.status}`}>{task.status}</span>
        </div>
        <h1>{task.title}</h1>
        <p className="task-meta">Time box: {task.timeBox}</p>
        <p>{task.summary}</p>
        <div className="task-actions">
          <a
            className="btn btn-primary"
            href={`/${task.readmePath}`}
            target="_blank"
            rel="noreferrer"
          >
            Open README
          </a>
          {task.demoPath && (
            <a
              className="btn btn-secondary"
              href={`/${task.demoPath}`}
              target="_blank"
              rel="noreferrer"
            >
              Open artifact
            </a>
          )}
        </div>
      </section>

      <section className="panel verification-panel">
        <h2>Reviewer checklist</h2>
        <ul className="checklist">
          <li>README documents goal, time box, and run instructions</li>
          <li>Artifacts exist under <code>tasks/{task.slug}/artifacts/</code></li>
          <li>Deliverables match the eval PDF requirements</li>
          <li>Commands in README were run and outputs are reproducible</li>
        </ul>
      </section>

      {artifactPreview && (
        <section className="panel artifact-panel">
          <div className="artifact-header">
            <h2>Artifact preview</h2>
            <code>{task.demoPath}</code>
          </div>
          <pre className="artifact-preview">{artifactPreview}</pre>
        </section>
      )}
    </div>
  );
}
