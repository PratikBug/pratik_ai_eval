export const A6_SERVICE_BASE = "/api/a6";
export const A6_TASK_SLUG = "tasks/a6-performance-profiling-and-targeted-improvement";
export const A6_PERFORMANCE_REPORT_PATH = `${A6_TASK_SLUG}/artifacts/performance-report.md`;

export interface A6ReportSummary {
  bottleneck: string;
  improvementPct: number;
  baselineMs?: number;
  afterMs?: number;
}

export interface A6ReportResponse {
  report: string;
  summary: A6ReportSummary;
}

export interface A6BenchmarkResponse {
  mode: string;
  baselineMs: number | null;
  afterMs: number | null;
  improvementPct: number | null;
  productCount: number;
  iterations: number;
  output: string;
}

export interface A6TestsResponse {
  exitCode: number;
  output: string;
  passed: boolean;
  passedCount: number;
}
