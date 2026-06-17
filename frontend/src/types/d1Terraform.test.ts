import { describe, expect, it } from "vitest";
import {
  D1_ARTIFACT_PATHS,
  D1_STACK_COMPONENTS,
  D1_TASK_SLUG,
  D1_VERIFY_CMD,
} from "./d1Terraform";

describe("d1Terraform", () => {
  it("points at the D1 task directory", () => {
    expect(D1_TASK_SLUG).toBe("tasks/d1-terraform-plan-for-a-small-service");
  });

  it("includes terraform validate and plan artifacts", () => {
    expect(D1_ARTIFACT_PATHS.validate).toContain("terraform-validate.txt");
    expect(D1_ARTIFACT_PATHS.plan).toContain("terraform-plan.txt");
  });

  it("documents the verify shell command", () => {
    expect(D1_VERIFY_CMD).toContain("scripts/verify.sh");
  });

  it("lists the core stack components", () => {
    expect(D1_STACK_COMPONENTS).toContain("LocalStack emulator (localhost:4566)");
    expect(D1_STACK_COMPONENTS.some((item) => item.includes("aws_lambda_function"))).toBe(true);
  });
});
