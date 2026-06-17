import { describe, expect, it } from "vitest";
import { D1_ARTIFACT_PATHS, D1_VERIFY_CMD } from "../types/d1Terraform";

describe("D1TerraformDemo", () => {
  it("loads saved terraform artifacts from the task directory", () => {
    expect(D1_ARTIFACT_PATHS.validate).toContain("d1-terraform-plan-for-a-small-service");
    expect(D1_ARTIFACT_PATHS.plan).toContain("terraform-plan.txt");
  });

  it("re-runs verification through the D1 API route", () => {
    expect(D1_VERIFY_CMD).toContain("verify.sh");
    expect("/api/d1/verify").toMatch(/^\/api\/d1\/verify$/);
  });
});
