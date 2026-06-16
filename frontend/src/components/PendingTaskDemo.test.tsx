import { describe, expect, it } from "vitest";
import { getTaskArchitecture } from "../pages/taskArchitectures";

describe("PendingTaskDemo", () => {
  it("uses I5 architecture for pending task preview content", () => {
    const architecture = getTaskArchitecture("I5");
    expect(architecture?.status).toBe("pending");
    expect(architecture?.flowSteps.length).toBeGreaterThan(0);
  });
});
