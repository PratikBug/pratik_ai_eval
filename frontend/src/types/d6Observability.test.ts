import { describe, expect, it } from "vitest";
import {
  D6_ARTIFACT_PATHS,
  D6_LOAD_CMD,
  D6_VERIFY_CMD,
} from "./d6Observability";

describe("d6Observability types", () => {
  it("defines artifact paths under the D6 task folder", () => {
    expect(D6_ARTIFACT_PATHS.dashboardPanel).toContain("dashboard-panel.json");
    expect(D6_ARTIFACT_PATHS.instrumentationDiff).toContain("instrumentation-diff.patch");
  });

  it("points verify command at verify.sh", () => {
    expect(D6_VERIFY_CMD).toContain("verify.sh");
    expect(D6_LOAD_CMD).toContain("load.sh");
  });
});
