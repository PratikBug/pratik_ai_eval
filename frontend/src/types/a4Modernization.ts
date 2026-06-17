export const A4_SERVICE_BASE = "/api/a4";
export const A4_TASK_SLUG = "tasks/a4-repository-modernization-plan-with-executable-first-step";
export const A4_MODERNIZATION_PLAN_PATH = `${A4_TASK_SLUG}/artifacts/modernization-plan.md`;

export interface A4VerifyResponse {
  exitCode: number;
  output: string;
  passed: boolean;
}

export interface A4PlanResponse {
  plan: string;
  summary: {
    firstStep: string;
    findingsCount: number;
    backlogItems: number;
  };
}
