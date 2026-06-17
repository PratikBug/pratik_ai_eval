import { describe, expect, it } from "vitest";
import {
  A6_PERFORMANCE_REPORT_PATH,
  A6_SERVICE_BASE,
  type A6BenchmarkResponse,
  type A6ReportResponse,
  type A6TestsResponse,
} from "./a6Performance";

describe("a6Performance types", () => {
  it("exports service constants", () => {
    expect(A6_SERVICE_BASE).toBe("/api/a6");
    expect(A6_PERFORMANCE_REPORT_PATH).toContain("performance-report.md");
  });

  it("allows benchmark response shape", () => {
    const sample: A6BenchmarkResponse = {
      mode: "both",
      baselineMs: 120.5,
      afterMs: 8.2,
      improvementPct: 93.2,
      productCount: 500,
      iterations: 5,
      output: "ok",
    };
    expect(sample.improvementPct).toBeGreaterThan(20);
  });

  it("allows report and tests response shapes", () => {
    const report: A6ReportResponse = {
      report: "# report",
      summary: { bottleneck: "N+1 queries", improvementPct: 93.2 },
    };
    const tests: A6TestsResponse = { exitCode: 0, output: "4 passed", passed: true, passedCount: 4 };
    expect(report.summary.bottleneck).toContain("N+1");
    expect(tests.passed).toBe(true);
  });
});
