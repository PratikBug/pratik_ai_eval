import { useEffect, useState } from "react";
import { TaskCard } from "../components/TaskCard";
import type { TasksManifest } from "../types/tasks";
import { countByStatus } from "../types/tasks";

export function TaskListPage() {
  const [manifest, setManifest] = useState<TasksManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/tasks.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load tasks (${response.status})`);
        return response.json();
      })
      .then(setManifest)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <div className="panel error-panel">Error: {error}</div>;
  }

  if (!manifest) {
    return <div className="panel loading-panel">Loading tasks…</div>;
  }

  const stats = countByStatus(manifest);

  return (
    <div className="page">
      <section className="hero panel">
        <p className="eyebrow">Self-evaluation workspace</p>
        <h1>{manifest.title}</h1>
        <p className="hero-copy">
          Browse eval tasks, open deliverables, and verify artifacts in the UI before
          model review.
        </p>
        <div className="stats-row">
          <div className="stat">
            <strong>{stats.total}</strong>
            <span>Total tasks</span>
          </div>
          <div className="stat">
            <strong>{stats.done}</strong>
            <span>Completed</span>
          </div>
          <div className="stat">
            <strong>{stats.pending}</strong>
            <span>Pending</span>
          </div>
        </div>
      </section>

      {manifest.categories.map((category) => (
        <section key={category.id} className="category-section">
          <div className="category-header">
            <h2>{category.label}</h2>
            <span>{category.tasks.length} tasks</span>
          </div>
          <div className="task-grid">
            {category.tasks.map((task) => (
              <TaskCard key={task.id} task={task} categoryLabel={category.label} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
