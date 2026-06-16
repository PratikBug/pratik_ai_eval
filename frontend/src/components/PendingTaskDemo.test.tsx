import { describe, expect, it } from "vitest";
import { getTaskArchitecture } from "../pages/taskArchitectures";

describe("PendingTaskDemo", () => {
  it("uses I4 architecture for pending task preview content", () => {
    const architecture = getTaskArchitecture("I4");
    expect(architecture?.status).toBe("pending");
    expect(architecture?.flowSteps.length).toBeGreaterThan(0);
  });
});
