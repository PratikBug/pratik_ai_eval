import { describe, expect, it } from "vitest";
import { I6_ROOT_CAUSE } from "../types/i6BugDiagnosis";

describe("I6BugDiagnosisDemo", () => {
  it("documents off-by-one threshold bug", () => {
    expect(I6_ROOT_CAUSE.summary).toContain("50");
    expect(I6_ROOT_CAUSE.line).toMatch(/shipping\.py/);
  });
});
