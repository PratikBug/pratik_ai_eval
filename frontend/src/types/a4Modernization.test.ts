import { describe, expect, it } from "vitest";
import {
  A4_MODERNIZATION_PLAN_PATH,
  A4_SERVICE_BASE,
  A4_TASK_SLUG,
  type A4VerifyResponse,
} from "./a4Modernization";

describe("a4Modernization types", () => {
  it("defines A4 service base and task slug", () => {
    expect(A4_SERVICE_BASE).toBe("/api/a4");
    expect(A4_TASK_SLUG).toContain("a4-repository-modernization");
  });

  it("points plan artifact at modernization-plan.md", () => {
    expect(A4_MODERNIZATION_PLAN_PATH).toContain("modernization-plan.md");
  });

  it("types A4VerifyResponse with exit code and output", () => {
    const sample: A4VerifyResponse = {
      exitCode: 0,
      output: "2 passed",
      passed: true,
    };
    expect(sample.passed).toBe(true);
  });
});
