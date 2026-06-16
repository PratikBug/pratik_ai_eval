import { describe, expect, it } from "vitest";
import { countByStatus, findTask, flattenTasks } from "../types/tasks";
import type { TasksManifest } from "../types/tasks";

const manifest: TasksManifest = {
  title: "Test",
  sourceDoc: "docs/test.pdf",
  categories: [
    {
      id: "basics",
      label: "Basics",
      tasks: [
        {
          id: "B1",
          slug: "b1",
          title: "Repo inventory",
          timeBox: "30 min",
          status: "done",
          summary: "Find artifacts",
          readmePath: "tasks/b1/README.md",
        },
        {
          id: "B2",
          slug: "b2",
          title: "API map",
          timeBox: "30 min",
          status: "pending",
          summary: "Map routes",
          readmePath: "tasks/b2/README.md",
        },
      ],
    },
  ],
};

describe("task helpers", () => {
  it("flattens tasks across categories", () => {
    expect(flattenTasks(manifest)).toHaveLength(2);
  });

  it("finds task by id case-insensitively", () => {
    expect(findTask(manifest, "b1")?.title).toBe("Repo inventory");
  });

  it("counts tasks by status", () => {
    expect(countByStatus(manifest)).toEqual({
      total: 2,
      done: 1,
      pending: 1,
      inProgress: 0,
    });
  });
});
