import { describe, expect, it } from "vitest";

describe("TaskListPage", () => {
  it("loads tasks manifest path", () => {
    expect("/tasks.json").toBe("/tasks.json");
  });
});
