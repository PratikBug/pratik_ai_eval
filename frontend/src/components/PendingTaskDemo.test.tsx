import { describe, expect, it } from "vitest";
import { getTaskArchitecture } from "../pages/taskArchitectures";

describe("PendingTaskDemo", () => {
  it("uses A1 architecture for done task overview content", () => {
    const architecture = getTaskArchitecture("A1");
    expect(architecture?.status).toBe("done");
    expect(architecture?.flowSteps.length).toBeGreaterThan(0);
    expect(architecture?.overview).toContain("Planning-only");
  });
});
