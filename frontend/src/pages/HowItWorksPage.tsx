import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Task, TasksManifest } from "../types/tasks";
import { EVAL_REPO_ARCHITECTURE, getTaskArchitecture } from "./taskArchitectures";

export function HowItWorksPage() {
  const [manifest, setManifest] = useState<TasksManifest | null>(null);

  useEffect(() => {
    fetch("/tasks.json")
      .then((response) => response.json())
      .then(setManifest)
      .catch(() => setManifest(null));
  }, []);

  return (
    <div className="page how-it-works-page">
      <Link to="/" className="back-link">
        ← All tasks
      </Link>

      <section className="panel how-hero">
        <p className="eyebrow">Eval repository</p>
        <h1>How it works</h1>
        <p className="hero-copy">{EVAL_REPO_ARCHITECTURE.overview}</p>
      </section>

      <section className="panel flow-panel">
        <h2>Overall architecture</h2>
        <p className="section-copy">
          The reviewer dashboard and task folders are separate but connected during local dev.
        </p>
        <pre className="diagram-code">{EVAL_REPO_ARCHITECTURE.mermaidDiagram}</pre>
      </section>

      <section className="panel structure-panel">
        <h2>Repository layout</h2>
        <pre className="diagram-code">{EVAL_REPO_ARCHITECTURE.repoStructure}</pre>
      </section>

      <section className="panel arch-index-panel">
        <h2>Per-task architecture</h2>
        <p className="section-copy">
          Each eval task has its own pipeline, components, and deliverables. Select a task to see
          how it works.
        </p>

        {!manifest && <p className="section-copy">Loading task list…</p>}

        {manifest?.categories.map((category) => (
          <div className="arch-category" key={category.id}>
            <h3>{category.label}</h3>
            <div className="arch-task-grid">
              {category.tasks.map((task: Task) => {
                const architecture = getTaskArchitecture(task.id);
                return (
                  <Link
                    key={task.id}
                    to={`/how-it-works/${task.id}`}
                    className="arch-task-card"
                  >
                    <div className="task-card-top">
                      <span className="task-id">{task.id}</span>
                      <span className={`status-pill status-${task.status}`}>{task.status}</span>
                    </div>
                    <strong>{task.title}</strong>
                    <p className="arch-task-summary">
                      {architecture?.overview ?? task.summary}
                    </p>
                    <span className="arch-task-link">View architecture →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
