import { describe, expect, it } from "vitest";
import { getTaskArchitecture } from "../pages/taskArchitectures";

describe("TaskArchitectureView", () => {
  it("has architecture data to render for done tasks", () => {
    const b1 = getTaskArchitecture("B1");
    expect(b1?.flowNodes.length).toBeGreaterThan(0);
    expect(b1?.runtimeRequirements.length).toBeGreaterThan(0);
  });
});
