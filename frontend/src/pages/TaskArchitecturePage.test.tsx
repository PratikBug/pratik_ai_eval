import { describe, expect, it } from "vitest";
import { getTaskArchitecture } from "./taskArchitectures";

describe("TaskArchitecturePage content", () => {
  it("resolves architecture by task id case-insensitively", () => {
    expect(getTaskArchitecture("b1")?.taskId).toBe("B1");
    expect(getTaskArchitecture("D6")?.title).toContain("Observability");
  });
});
