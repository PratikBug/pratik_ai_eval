import { describe, expect, it } from "vitest";
import { getTaskArchitecture } from "../pages/taskArchitectures";

describe("PendingTaskDemo", () => {
  it("uses I2 architecture for pending task preview content", () => {
    const architecture = getTaskArchitecture("I2");
    expect(architecture?.status).toBe("pending");
    expect(architecture?.flowSteps.length).toBeGreaterThan(0);
    expect(architecture?.flowNodes.some((node) => node.label === "Entry point")).toBe(true);
  });
});
