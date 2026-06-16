export interface Transaction {
  id: number;
  amount: string;
  type: "credit" | "debit";
  description: string | null;
}

export interface Balance {
  balance: string;
  currency: "USD";
}

export interface TransactionCreatePayload {
  amount: string;
  type: "credit" | "debit";
  description?: string;
}

export interface PytestRunSummary {
  testsPassed: number | null;
  passed: boolean;
  durationMs: number | null;
}

export interface PytestRunResponse {
  output: string;
  exitCode: number;
  summary: PytestRunSummary;
  savedProof?: string;
}

const PYTEST_PASSED_RE = /(\d+) passed/;
const PYTEST_DURATION_RE = /in ([\d.]+)s/;

export function parsePytestOutput(output: string, exitCode: number): PytestRunSummary {
  const passedMatch = output.match(PYTEST_PASSED_RE);
  const durationMatch = output.match(PYTEST_DURATION_RE);

  return {
    testsPassed: passedMatch ? Number(passedMatch[1]) : null,
    passed: exitCode === 0,
    durationMs: durationMatch ? Math.round(Number(durationMatch[1]) * 1000) : null,
  };
}

export function formatLedgerBalance(balance: Balance): string {
  return `${balance.currency} ${balance.balance}`;
}

export const B4_SERVICE_BASE = "/api/b4/service";
export const B5_SERVICE_BASE = "/api/b5/service";

export type VitestRunResponse = PytestRunResponse & {
  summary: PytestRunResponse["summary"] & {
    testFilesPassed?: number | null;
    testsPassed?: number | null;
  };
};
