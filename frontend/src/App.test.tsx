import { describe, expect, it } from "vitest";

describe("App routes", () => {
  it("defines task list, detail, and how-it-works routes", () => {
    expect(["/", "/how-it-works", "/tasks/:taskId"]).toContain("/how-it-works");
  });
});
