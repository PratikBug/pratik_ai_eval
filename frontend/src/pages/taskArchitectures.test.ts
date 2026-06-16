import { describe, expect, it } from "vitest";
import {
  EVAL_REPO_ARCHITECTURE,
  getTaskArchitecture,
  listTaskArchitectureIds,
} from "./taskArchitectures";

describe("taskArchitectures", () => {
  it("defines architecture for all 24 eval tasks", () => {
    const ids = listTaskArchitectureIds();
    expect(ids).toHaveLength(24);
    expect(ids).toContain("B1");
    expect(ids).toContain("B2");
    expect(ids).toContain("D6");
  });

  it("returns B1 with pipeline steps and diagram", () => {
    const b1 = getTaskArchitecture("B1");
    expect(b1).toBeDefined();
    expect(b1?.status).toBe("done");
    expect(b1?.flowSteps.length).toBeGreaterThanOrEqual(6);
    expect(b1?.mermaidDiagram).toContain("flowchart TD");
    expect(b1?.repoStructure).toContain("inventory_scanner.py");
  });

  it("returns B2 with endpoint scanner architecture", () => {
    const b2 = getTaskArchitecture("B2");
    expect(b2).toBeDefined();
    expect(b2?.status).toBe("done");
    expect(b2?.repoStructure).toContain("endpoint_scanner.py");
  });

  it("returns planned architecture for pending tasks", () => {
    const b3 = getTaskArchitecture("b3");
    expect(b3?.status).toBe("pending");
    expect(b3?.flowSteps.length).toBeGreaterThan(0);
  });

  it("documents overall eval repo architecture", () => {
    expect(EVAL_REPO_ARCHITECTURE.overview).toContain("reviewer");
    expect(EVAL_REPO_ARCHITECTURE.mermaidDiagram).toContain("Reviewer");
    expect(EVAL_REPO_ARCHITECTURE.repoStructure).toContain("frontend/");
  });
});
