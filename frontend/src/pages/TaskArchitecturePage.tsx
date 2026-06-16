import { Link, useParams } from "react-router-dom";
import { TaskArchitectureView } from "../components/TaskArchitectureView";
import { getTaskArchitecture } from "./taskArchitectures";

export function TaskArchitecturePage() {
  const { taskId = "" } = useParams();
  const architecture = getTaskArchitecture(taskId);

  if (!architecture) {
    return (
      <div className="page how-it-works-page">
        <Link to="/how-it-works" className="back-link">
          ← How it works
        </Link>
        <section className="panel error-panel">
          Architecture for task <code>{taskId}</code> not found.{" "}
          <Link to="/how-it-works">Back to index</Link>
        </section>
      </div>
    );
  }

  return (
    <TaskArchitectureView
      architecture={architecture}
      backTo="/how-it-works"
      backLabel="← All architectures"
      taskDetailPath={`/tasks/${architecture.taskId}`}
    />
  );
}
