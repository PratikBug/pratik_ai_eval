export const D3_WORKFLOW_PATH = ".github/workflows/ci.yml";

export const D3_RUN_ACT_CMD =
  "bash tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image/scripts/run-act.sh";

export const D3_RUN_LOCAL_CMD =
  "bash tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image/scripts/run-local-ci.sh";

export const D3_FAILURE_DEMO_CMD =
  "bash tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image/scripts/demo-ci-failure.sh";

export const D3_CI_JOBS = ["lint", "test (matrix 3.11/3.12)", "build"];

export const D3_ARTIFACT_PATHS = {
  ciRunLog: "tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image/artifacts/ci-run-log.txt",
  ciFailureLog:
    "tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image/artifacts/ci-failure-log.txt",
  workflow: D3_WORKFLOW_PATH,
} as const;

export type D3CiRunResponse = {
  output: string;
  exitCode: number;
  ciRunLog?: string;
  ciFailureLog?: string;
};
