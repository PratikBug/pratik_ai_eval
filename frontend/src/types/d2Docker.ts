export const D2_E2E_CMD =
  "cd tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests && bash scripts/e2e.sh";

export const D2_TEARDOWN_CMD =
  "cd tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests && bash scripts/teardown.sh";

export const D2_COMPOSE_UP_CMD =
  "cd tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests && docker-compose up --build -d";

export const D2_API_PORT = 8090;

export const D2_STACK_SERVICES = ["db (Postgres 16)", "api (FastAPI)", "worker (Python poll loop)"];

export const D2_ARTIFACT_PATHS = {
  e2eOutput: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/artifacts/e2e-output.txt",
  serviceLogs: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/artifacts/service-logs.txt",
  compose: "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/docker-compose.yml",
} as const;

export type D2E2eResponse = {
  output: string;
  exitCode: number;
  e2eOutput?: string;
  serviceLogs?: string;
};
