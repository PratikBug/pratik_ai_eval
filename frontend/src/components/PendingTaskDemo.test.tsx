import { describe, expect, it } from "vitest";
import { getTaskArchitecture } from "../pages/taskArchitectures";

describe("PendingTaskDemo", () => {
  it("uses A1 architecture for pending task preview content", () => {
    const architecture = getTaskArchitecture("A1");
    expect(architecture?.status).toBe("pending");
    expect(architecture?.flowSteps.length).toBeGreaterThan(0);
  });
});
