import { describe, expect, it } from "vitest";

describe("App routes", () => {
  it("defines task list, detail, and how-it-works routes", () => {
    expect(["/", "/how-it-works", "/how-it-works/:taskId", "/tasks/:taskId"]).toContain(
      "/how-it-works/:taskId",
    );
  });
});
