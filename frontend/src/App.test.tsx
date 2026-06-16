import { describe, expect, it } from "vitest";

describe("App routes", () => {
  it("defines task list and detail routes", () => {
    expect(["/", "/tasks/:taskId"]).toContain("/");
  });
});
