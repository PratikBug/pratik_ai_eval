export const A3_SERVICE_BASE = "/api/a3/service";
export const A3_TASK_SLUG = "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine";

export interface A3EventCreate {
  transaction_id: string;
  amount: number;
  merchant_id: string;
}

export interface A3EventAccepted {
  transaction_id: string;
  status: string;
}

export interface A3ScoreRecord {
  transaction_id: string;
  amount: number;
  merchant_id: string;
  score: number;
  reasons: string[];
}

export interface A3SmokeStep {
  label: string;
  status: number;
  body: unknown;
}

export interface A3SmokeResponse {
  steps: A3SmokeStep[];
  exitCode: number;
}

export interface A3LayerTestResponse {
  output: string;
  exitCode: number;
  summary: {
    passed: boolean;
    testsPassed?: number | null;
    testFilesPassed?: number | null;
    durationMs?: number | null;
  };
  savedProof?: string;
}

export const A3_DEFAULT_EVENT: A3EventCreate = {
  transaction_id: "tx-reviewer-demo",
  amount: 150,
  merchant_id: "m-42",
};
