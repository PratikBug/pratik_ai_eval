import { describe, expect, it } from "vitest";
import {
  A5_CODE_REVIEW_REPORT_PATH,
  A5_SERVICE_BASE,
  A5_TASK_SLUG,
  type A5ReportResponse,
  type A5VerifyResponse,
} from "./a5CodeReview";

describe("a5CodeReview types", () => {
  it("defines A5 service base and task slug", () => {
    expect(A5_SERVICE_BASE).toBe("/api/a5");
    expect(A5_TASK_SLUG).toContain("a5-agent-code-review");
  });

  it("points at code-review-report artifact", () => {
    expect(A5_CODE_REVIEW_REPORT_PATH).toContain("code-review-report.md");
  });

  it("types A5ReportResponse with issue summary", () => {
    const sample: A5ReportResponse = {
      report: "# report",
      summary: {
        verdict: "Request changes",
        totalIssues: 14,
        blocking: 7,
        bySeverity: { critical: 2, high: 5, medium: 5, low: 2 },
      },
      prFiles: ["review-target/app.py"],
    };
    expect(sample.summary.blocking).toBe(7);
  });

  it("types A5VerifyResponse with exit code and output", () => {
    const sample: A5VerifyResponse = {
      exitCode: 0,
      output: "passed",
      passed: true,
    };
    expect(sample.passed).toBe(true);
  });
});
