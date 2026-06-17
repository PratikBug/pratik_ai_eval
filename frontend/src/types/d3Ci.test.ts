import { describe, expect, it } from "vitest";
import { D3_ARTIFACT_PATHS, D3_RUN_ACT_CMD, D3_WORKFLOW_PATH } from "./d3Ci";

describe("d3Ci types", () => {
  it("exports CI constants", () => {
    expect(D3_WORKFLOW_PATH).toContain(".github/workflows/ci.yml");
    expect(D3_RUN_ACT_CMD).toContain("run-act.sh");
    expect(D3_ARTIFACT_PATHS.ciRunLog).toContain("ci-run-log.txt");
  });
});
