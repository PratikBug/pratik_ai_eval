export const A5_SERVICE_BASE = "/api/a5";
export const A5_TASK_SLUG = "tasks/a5-agent-code-review-and-adversarial-verification";
export const A5_CODE_REVIEW_REPORT_PATH = `${A5_TASK_SLUG}/artifacts/code-review-report.md`;

export interface A5IssueSummary {
  verdict: string;
  totalIssues: number;
  blocking: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface A5ReportResponse {
  report: string;
  summary: A5IssueSummary;
  prFiles: string[];
  patchLines: number;
}

export interface A5VerifyResponse {
  exitCode: number;
  output: string;
  passed: boolean;
}

export interface A5GrepResponse {
  pattern: string;
  matches: string[];
  count: number;
}
