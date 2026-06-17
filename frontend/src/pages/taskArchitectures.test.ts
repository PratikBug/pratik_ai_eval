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
    expect(a2?.repoStructure).toContain("A2WorktreeDemo.tsx");
    expect(a2?.flowSteps.length).toBeGreaterThanOrEqual(7);
    expect(a2?.mermaidDiagram).toContain("feat/a2-data-layer");
  });

  it("returns A3 with polyglot fraud-score architecture", () => {
    const a3 = getTaskArchitecture("A3");
    expect(a3?.status).toBe("done");
    expect(a3?.repoStructure).toContain("A3PolyglotDemo.tsx");
    expect(a3?.repoStructure).toContain("engine/");
    expect(a3?.flowSteps.length).toBeGreaterThanOrEqual(6);
    expect(a3?.mermaidDiagram).toContain("Rust engine");
  });

  it("returns A4 with modernization plan architecture", () => {
    const a4 = getTaskArchitecture("A4");
    expect(a4?.status).toBe("done");
    expect(a4?.repoStructure).toContain("A4ModernizationDemo.tsx");
    expect(a4?.repoStructure).toContain("modernization-plan.md");
    expect(a4?.flowSteps.length).toBeGreaterThanOrEqual(6);
    expect(a4?.mermaidDiagram).toContain("pytest");
  });

  it("returns A5 with code review architecture", () => {
    const a5 = getTaskArchitecture("A5");
    expect(a5?.status).toBe("done");
    expect(a5?.repoStructure).toContain("A5CodeReviewDemo.tsx");
    expect(a5?.repoStructure).toContain("code-review-report.md");
    expect(a5?.repoStructure).toContain("review-target/");
    expect(a5?.flowSteps.length).toBeGreaterThanOrEqual(6);
    expect(a5?.mermaidDiagram).toContain("Findings");
  });

  it("returns A6 with performance profiling architecture", () => {
    const a6 = getTaskArchitecture("A6");
    expect(a6?.status).toBe("done");
    expect(a6?.repoStructure).toContain("A6PerformanceDemo.tsx");
    expect(a6?.repoStructure).toContain("performance-report.md");
    expect(a6?.repoStructure).toContain("profile-target/");
    expect(a6?.flowSteps.length).toBeGreaterThanOrEqual(6);
    expect(a6?.mermaidDiagram).toContain("cProfile");
  });

  it("returns D1 with terraform LocalStack architecture", () => {
    const d1 = getTaskArchitecture("D1");
    expect(d1?.status).toBe("done");
    expect(d1?.repoStructure).toContain("D1TerraformDemo.tsx");
    expect(d1?.repoStructure).toContain("main.tf");
    expect(d1?.flowSteps.length).toBeGreaterThanOrEqual(5);
    expect(d1?.mermaidDiagram).toContain("LocalStack");
  });

  it("returns D2 with docker-compose E2E architecture", () => {
    const d2 = getTaskArchitecture("D2");
    expect(d2?.status).toBe("done");
    expect(d2?.repoStructure).toContain("D2DockerDemo.tsx");
    expect(d2?.repoStructure).toContain("docker-compose.yml");
    expect(d2?.flowSteps.length).toBeGreaterThanOrEqual(5);
    expect(d2?.mermaidDiagram).toContain("Postgres");
  });

  it("returns D3 with CI pipeline architecture", () => {
    const d3 = getTaskArchitecture("D3");
    expect(d3?.status).toBe("done");
    expect(d3?.repoStructure).toContain("D3CiDemo.tsx");
    expect(d3?.repoStructure).toContain(".github/workflows/ci.yml");
    expect(d3?.flowSteps.length).toBeGreaterThanOrEqual(5);
    expect(d3?.mermaidDiagram).toContain("docker_build");
  });

  it("returns D4 with Kubernetes architecture", () => {
    const d4 = getTaskArchitecture("D4");
    expect(d4?.status).toBe("done");
    expect(d4?.repoStructure).toContain("D4K8sDemo.tsx");
    expect(d4?.repoStructure).toContain("k8s/");
    expect(d4?.flowSteps.length).toBeGreaterThanOrEqual(5);
    expect(d4?.mermaidDiagram).toContain("curl proof");
  });

  it("returns D5 with bootstrap architecture", () => {
    const d5 = getTaskArchitecture("D5");
    expect(d5?.status).toBe("done");
    expect(d5?.repoStructure).toContain("D5BootstrapDemo.tsx");
    expect(d5?.repoStructure).toContain(".mise.toml");
    expect(d5?.flowSteps.length).toBeGreaterThanOrEqual(5);
    expect(d5?.mermaidDiagram).toContain("make bootstrap");
  });

  it("returns D6 with observability architecture", () => {
    const d6 = getTaskArchitecture("D6");
    expect(d6?.status).toBe("done");
    expect(d6?.repoStructure).toContain("D6ObservabilityDemo.tsx");
    expect(d6?.repoStructure).toContain("prometheus");
    expect(d6?.flowSteps.length).toBeGreaterThanOrEqual(5);
    expect(d6?.mermaidDiagram).toContain("Grafana");
  });

  it("documents overall eval repo architecture", () => {
    expect(EVAL_REPO_ARCHITECTURE.overview).toContain("reviewer");
    expect(EVAL_REPO_ARCHITECTURE.mermaidDiagram).toContain("Reviewer");
    expect(EVAL_REPO_ARCHITECTURE.repoStructure).toContain("frontend/");
  });
});
