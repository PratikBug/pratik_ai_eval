export interface LogLevelCounts {
  info: number;
  warn: number;
  error: number;
}

export interface CargoTestSummary {
  testsPassed: number | null;
  passed: boolean;
  durationMs: number | null;
}

export interface CargoTestResponse {
  output: string;
  exitCode: number;
  summary: CargoTestSummary;
  savedProof?: string;
}

export interface CliRunResponse {
  output: string;
  stderr: string;
  exitCode: number;
  counts: LogLevelCounts | null;
  command: string;
}

const LOG_COUNTER_LINE_RE = /^(INFO|WARN|ERROR):\s+(\d+)\s*$/gm;
const CARGO_PASSED_RE = /(\d+) passed/;
const CARGO_DURATION_RE = /finished in ([\d.]+)s/;

export function parseLogCounterOutput(output: string): LogLevelCounts | null {
  const counts: LogLevelCounts = { info: 0, warn: 0, error: 0 };
  let matched = false;

  for (const match of output.matchAll(LOG_COUNTER_LINE_RE)) {
    matched = true;
    const level = match[1];
    const value = Number(match[2]);
    if (level === "INFO") counts.info = value;
    if (level === "WARN") counts.warn = value;
    if (level === "ERROR") counts.error = value;
  }

  return matched ? counts : null;
}

export function parseCargoTestOutput(output: string, exitCode: number): CargoTestSummary {
  const passedMatch = output.match(CARGO_PASSED_RE);
  const durationMatch = output.match(CARGO_DURATION_RE);

  return {
    testsPassed: passedMatch ? Number(passedMatch[1]) : null,
    passed: exitCode === 0,
    durationMs: durationMatch ? Math.round(Number(durationMatch[1]) * 1000) : null,
  };
}

export const B6_SAMPLE_LOG = "sample.log";
export const B6_MISSING_LOG = "missing.log";
