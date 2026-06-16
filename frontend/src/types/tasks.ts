export interface Task {
  id: string;
  slug: string;
  title: string;
  timeBox: string;
  status: "done" | "pending" | "in_progress";
  summary: string;
  readmePath: string;
  demoPath?: string;
}

export interface TaskCategory {
  id: string;
  label: string;
  tasks: Task[];
}

export interface TasksManifest {
  title: string;
  sourceDoc: string;
  categories: TaskCategory[];
}

export function flattenTasks(manifest: TasksManifest): Task[] {
  return manifest.categories.flatMap((category) => category.tasks);
}

export function findTask(manifest: TasksManifest, taskId: string): Task | undefined {
  return flattenTasks(manifest).find(
    (task) => task.id.toLowerCase() === taskId.toLowerCase(),
  );
}

export function countByStatus(manifest: TasksManifest) {
  const tasks = flattenTasks(manifest);
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
  };
}
