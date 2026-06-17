import { describe, expect, it } from "vitest";
import { D4_ARTIFACT_PATHS, D4_VERIFY_CMD } from "../types/d4K8s";

describe("D4K8sDemo", () => {
  it("loads K8s artifacts from the task directory", () => {
    expect(D4_ARTIFACT_PATHS.dryRun).toContain("d4-kubernetes");
    expect(D4_ARTIFACT_PATHS.curlProof).toContain("curl-proof.txt");
  });

  it("re-runs verify through the D4 API route", () => {
    expect(D4_VERIFY_CMD).toContain("verify.sh");
    expect("/api/d4/k8s").toMatch(/^\/api\/d4\/k8s$/);
  });
});
