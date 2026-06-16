import { describe, expect, it } from "vitest";
import {
  I6_AGENT_VS_MANUAL,
  I6_ARTIFACT_PATHS,
  I6_BUGGY_FILE,
  I6_ROOT_CAUSE,
  I6_VERIFY_CMD,
} from "./i6BugDiagnosis";

describe("i6BugDiagnosis", () => {
  it("points to shipping.py as buggy module", () => {
    expect(I6_BUGGY_FILE).toContain("shipping.py");
    expect(I6_ROOT_CAUSE.operator).toBe(">");
    expect(I6_ROOT_CAUSE.fix).toBe(">=");
  });

  it("documents artifact paths", () => {
    expect(I6_ARTIFACT_PATHS.bugReport).toContain("bug-report.md");
    expect(I6_ARTIFACT_PATHS.fixVerification).toContain("fix-verification.txt");
  });

  it("includes pytest verification command", () => {
    expect(I6_VERIFY_CMD).toContain("pytest");
  });

  it("lists agent vs manual verification rows", () => {
    expect(I6_AGENT_VS_MANUAL.length).toBeGreaterThanOrEqual(4);
  });
});
