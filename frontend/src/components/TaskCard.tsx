import { Link } from "react-router-dom";
import type { Task } from "../types/tasks";

interface TaskCardProps {
  task: Task;
  categoryLabel: string;
}

const statusLabel: Record<Task["status"], string> = {
  done: "Done",
  pending: "Pending",
  in_progress: "In progress",
};

export function TaskCard({ task, categoryLabel }: TaskCardProps) {
  return (
    <article className={`task-card status-${task.status}`}>
      <div className="task-card-top">
        <span className="task-id">{task.id}</span>
        <span className={`status-pill status-${task.status}`}>
          {statusLabel[task.status]}
        </span>
      </div>
      <h3>{task.title}</h3>
      <p className="task-meta">
        {categoryLabel} · {task.timeBox}
      </p>
      <p className="task-summary">{task.summary}</p>
      <div className="task-actions">
        <Link to={`/tasks/${task.id}`} className="btn btn-primary">
          Review task
        </Link>
        {task.demoPath && (
          <a
            className="btn btn-secondary"
            href={`/${task.demoPath}`}
            target="_blank"
            rel="noreferrer"
          >
            View artifact
          </a>
        )}
      </div>
    </article>
  );
}
