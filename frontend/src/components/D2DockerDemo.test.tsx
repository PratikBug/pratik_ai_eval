import { describe, expect, it } from "vitest";
import { D2_ARTIFACT_PATHS, D2_E2E_CMD } from "../types/d2Docker";

describe("D2DockerDemo", () => {
  it("loads saved e2e artifacts from the task directory", () => {
    expect(D2_ARTIFACT_PATHS.e2eOutput).toContain("d2-docker-compose-stack");
    expect(D2_ARTIFACT_PATHS.serviceLogs).toContain("service-logs.txt");
  });

  it("re-runs e2e through the D2 API route", () => {
    expect(D2_E2E_CMD).toContain("scripts/e2e.sh");
    expect("/api/d2/e2e").toMatch(/^\/api\/d2\/e2e$/);
  });
});
