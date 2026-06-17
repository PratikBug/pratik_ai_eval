import { describe, expect, it } from "vitest";
import {
  D2_API_PORT,
  D2_ARTIFACT_PATHS,
  D2_E2E_CMD,
  D2_STACK_SERVICES,
} from "./d2Docker";

describe("d2Docker types", () => {
  it("exports stack constants", () => {
    expect(D2_API_PORT).toBe(8090);
    expect(D2_STACK_SERVICES).toHaveLength(3);
    expect(D2_E2E_CMD).toContain("scripts/e2e.sh");
    expect(D2_ARTIFACT_PATHS.e2eOutput).toContain("e2e-output.txt");
  });
});
