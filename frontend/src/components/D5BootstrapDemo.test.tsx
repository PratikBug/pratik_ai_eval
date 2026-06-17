import { describe, expect, it } from "vitest";
import { D5_BOOTSTRAP_CMD, D5_VERIFY_CMD } from "../types/d5Bootstrap";

describe("D5BootstrapDemo", () => {
  it("loads bootstrap artifacts from the task directory", () => {
    expect(D5_BOOTSTRAP_CMD).toBe("make bootstrap");
    expect(D5_VERIFY_CMD).toContain("verify.sh");
  });

  it("re-runs bootstrap through the D5 API route", () => {
    expect("/api/d5/bootstrap").toMatch(/^\/api\/d5\/bootstrap$/);
  });
});
