import { describe, expect, it } from "vitest";
import { B1_FLOW_STEPS, B1_MERMAID_DIAGRAM, B1_REPO_STRUCTURE } from "./howItWorksContent";

describe("howItWorksContent", () => {
  it("defines pipeline steps and diagram content", () => {
    expect(B1_FLOW_STEPS).toHaveLength(6);
    expect(B1_MERMAID_DIAGRAM).toContain("flowchart TD");
    expect(B1_REPO_STRUCTURE).toContain("inventory_scanner.py");
  });
});
