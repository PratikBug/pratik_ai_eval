export const I5_DOCKER_IMAGE = "pratik-i5-convert-api:latest";

export const I5_SERVICE_PORT = 8080;

export const I5_DOCKER_BUILD_CMD =
  "docker build -f tasks/i5-dockerize-and-run/Dockerfile -t pratik-i5-convert-api:latest tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api";

export const I5_COMPOSE_UP_CMD = "cd tasks/i5-dockerize-and-run && docker compose up --build";

export const I5_ARTIFACT_PATHS = {
  dockerfile: "tasks/i5-dockerize-and-run/Dockerfile",
  dockerCompose: "tasks/i5-dockerize-and-run/docker-compose.yml",
  buildProof: "tasks/i5-dockerize-and-run/artifacts/build-proof.txt",
  curlProof: "tasks/i5-dockerize-and-run/artifacts/curl-proof.txt",
} as const;

export const I5_DOCKERFILE_CHECKS = [
  "python:3.11-slim-bookworm",
  "requirements-docker.txt",
  "HEALTHCHECK",
  "USER app",
  "uvicorn",
  "0.0.0.0:8080",
] as const;

export interface I5ScriptRunResponse {
  output: string;
  exitCode: number;
  mode: "docker" | "smoke-local";
}
