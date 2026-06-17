export const A2_TASK_SLUG = "tasks/a2-execute-two-parallel-worktrees";
export const A2_SANDBOX = `${A2_TASK_SLUG}/sandbox/expense-tracker`;
export const A2_SERVICE_BASE = "/api/a2/service";

export const A2_ARTIFACT_PATHS = {
  mergeProof: `${A2_TASK_SLUG}/artifacts/merge-proof.md`,
  laneA: `${A2_TASK_SLUG}/artifacts/lane-a-output.txt`,
  laneB: `${A2_TASK_SLUG}/artifacts/lane-b-output.txt`,
  finalTests: `${A2_TASK_SLUG}/artifacts/final-test-output.txt`,
} as const;

export type A2ArtifactView = "merge" | "laneA" | "laneB" | "savedTests";

export const A2_ARTIFACT_VIEWS: { id: A2ArtifactView; label: string }[] = [
  { id: "merge", label: "Merge proof" },
  { id: "laneA", label: "Lane A output" },
  { id: "laneB", label: "Lane B output" },
  { id: "savedTests", label: "Saved test proof" },
];

export interface A2WorktreeLane {
  lane: string;
  branch: string;
  worktree: string;
  owns: string;
}

export const A2_WORKTREE_LANES: A2WorktreeLane[] = [
  {
    lane: "A — Data",
    branch: "feat/a2-data-layer",
    worktree: "sandbox/expense-tracker-lane-a/",
    owns: "app/models.py, app/database.py, app/config.py",
  },
  {
    lane: "B — API",
    branch: "feat/a2-api-endpoints",
    worktree: "sandbox/expense-tracker-lane-b/",
    owns: "app/main.py, app/schemas.py, app/routes/*, requirements.txt",
  },
];

export interface A2Transaction {
  id: number;
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
}

export interface A2Balance {
  balance: number;
}

export interface A2TransactionCreate {
  amount: number;
  category: string;
  description?: string;
}

export interface A2SmokeStep {
  label: string;
  status: number;
  body: unknown;
}

export interface A2SmokeResponse {
  steps: A2SmokeStep[];
  exitCode: number;
}
