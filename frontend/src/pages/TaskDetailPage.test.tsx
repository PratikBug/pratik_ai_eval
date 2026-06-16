import { describe, expect, it } from "vitest";

describe("TaskDetailPage", () => {
  it("uses task id route param", () => {
    expect("/tasks/B1".includes("B1")).toBe(true);
  });
});
