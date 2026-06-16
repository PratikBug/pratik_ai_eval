import { describe, expect, it } from "vitest";
import {
  I3_ARTIFACT_PATHS,
  I3_CHANGED_FILES,
  I3_CHANGE_BRANCH,
  I3_TARGET_MODULE,
  I3_CHANGE_VIEWS,
} from "./i3SafeChange";

describe("i3SafeChange", () => {
  it("documents the B6 log-counter as unfamiliar target", () => {
    expect(I3_TARGET_MODULE.path).toContain("b6-rust-greenfield");
    expect(I3_TARGET_MODULE.file).toContain("lib.rs");
  });

  it("lists only lib.rs as changed file", () => {
    expect(I3_CHANGED_FILES).toHaveLength(1);
    expect(I3_CHANGED_FILES[0].path).toContain("lib.rs");
  });

  it("points to I3 artifact paths", () => {
    expect(I3_ARTIFACT_PATHS.changeSummary).toContain("change-summary.md");
    expect(I3_ARTIFACT_PATHS.riskAssessment).toContain("risk-assessment.md");
    expect(I3_ARTIFACT_PATHS.changePatch).toContain("change.patch");
  });

  it("records logical branch name", () => {
    expect(I3_CHANGE_BRANCH).toContain("i3/");
  });

  it("defines summary, risk, patch, and test view modes", () => {
    expect(I3_CHANGE_VIEWS.map((view) => view.id)).toEqual([
      "summary",
      "risk",
      "patch",
      "tests",
    ]);
  });
});
