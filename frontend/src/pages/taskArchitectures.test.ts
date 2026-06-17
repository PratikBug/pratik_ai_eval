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

  it("returns B3 with Vitest discovery architecture", () => {
    const b3 = getTaskArchitecture("b3");
    expect(b3?.status).toBe("done");
    expect(b3?.repoStructure).toContain("vite-plugin-b3-tests.ts");
    expect(b3?.flowSteps.length).toBeGreaterThanOrEqual(5);
  });

  it("returns B4 with FastAPI service architecture", () => {
    const b4 = getTaskArchitecture("b4");
    expect(b4?.status).toBe("done");
    expect(b4?.repoStructure).toContain("B4FastApiDemo.tsx");
  });

  it("returns B5 with Express API architecture", () => {
    const b5 = getTaskArchitecture("b5");
    expect(b5?.status).toBe("done");
    expect(b5?.repoStructure).toContain("B5NodeApiDemo.tsx");
  });

  it("returns B6 with Rust CLI architecture", () => {
    const b6 = getTaskArchitecture("b6");
    expect(b6?.status).toBe("done");
    expect(b6?.repoStructure).toContain("B6RustDemo.tsx");
  });

  it("returns I1 with ER diagram architecture", () => {
    const i1 = getTaskArchitecture("i1");
    expect(i1?.status).toBe("done");
    expect(i1?.repoStructure).toContain("er-diagram.mmd");
  });

  it("returns I2 with flow trace architecture", () => {
    const i2 = getTaskArchitecture("i2");
    expect(i2?.status).toBe("done");
    expect(i2?.repoStructure).toContain("flow-trace.md");
    expect(i2?.repoStructure).toContain("I2FlowTraceDemo.tsx");
  });

  it("returns I3 with safe change architecture", () => {
    const i3 = getTaskArchitecture("i3");
    expect(i3?.status).toBe("done");
    expect(i3?.repoStructure).toContain("change.patch");
    expect(i3?.repoStructure).toContain("I3SafeChangeDemo.tsx");
  });

  it("returns I4 with polyglot pair architecture", () => {
    const i4 = getTaskArchitecture("i4");
    expect(i4?.status).toBe("done");
    expect(i4?.repoStructure).toContain("I4PolyglotDemo.tsx");
    expect(i4?.repoStructure).toContain("api/");
  });

  it("returns I5 with docker architecture", () => {
    const i5 = getTaskArchitecture("i5");
    expect(i5?.status).toBe("done");
    expect(i5?.repoStructure).toContain("Dockerfile");
    expect(i5?.repoStructure).toContain("I5DockerDemo.tsx");
  });

  it("returns I6 with bug diagnosis architecture", () => {
    const i6 = getTaskArchitecture("i6");
    expect(i6?.status).toBe("done");
    expect(i6?.repoStructure).toContain("bug-report.md");
    expect(i6?.repoStructure).toContain("I6BugDiagnosisDemo.tsx");
  });

  it("returns A1 with parallel worktree planning architecture", () => {
    const a1 = getTaskArchitecture("A1");
    expect(a1?.status).toBe("done");
    expect(a1?.repoStructure).toContain("parallel-plan.md");
    expect(a1?.repoStructure).toContain("shared-contract.md");
    expect(a1?.flowSteps.length).toBeGreaterThanOrEqual(7);
    expect(a1?.mermaidDiagram).toContain("feat/data-layer");
  });

  it("returns A2 with parallel worktree execution architecture", () => {
    const a2 = getTaskArchitecture("A2");
    expect(a2?.status).toBe("done");
    expect(a2?.repoStructure).toContain("merge-proof.md");
    expect(a2?.repoStructure).toContain("sandbox/expense-tracker");
    expect(a2?.flowSteps.length).toBeGreaterThanOrEqual(7);
    expect(a2?.mermaidDiagram).toContain("feat/a2-data-layer");
  });

  it("documents overall eval repo architecture", () => {
    expect(EVAL_REPO_ARCHITECTURE.overview).toContain("reviewer");
    expect(EVAL_REPO_ARCHITECTURE.mermaidDiagram).toContain("Reviewer");
    expect(EVAL_REPO_ARCHITECTURE.repoStructure).toContain("frontend/");
  });
});
