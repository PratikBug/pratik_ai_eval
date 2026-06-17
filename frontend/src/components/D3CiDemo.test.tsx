import { describe, expect, it } from "vitest";
import { D3_ARTIFACT_PATHS, D3_RUN_LOCAL_CMD } from "../types/d3Ci";

describe("D3CiDemo", () => {
  it("loads CI artifacts from the task directory", () => {
    expect(D3_ARTIFACT_PATHS.ciRunLog).toContain("d3-ci-pipeline");
    expect(D3_ARTIFACT_PATHS.workflow).toContain("ci.yml");
  });

  it("re-runs CI through the D3 API route", () => {
    expect(D3_RUN_LOCAL_CMD).toContain("run-local-ci.sh");
    expect("/api/d3/ci").toMatch(/^\/api\/d3\/ci$/);
  });
});
