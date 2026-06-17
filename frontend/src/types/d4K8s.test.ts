import { describe, expect, it } from "vitest";
import { D4_ARTIFACT_PATHS, D4_MANIFESTS, D4_VERIFY_CMD } from "./d4K8s";

describe("d4K8s types", () => {
  it("defines artifact paths under the D4 task folder", () => {
    expect(D4_ARTIFACT_PATHS.dryRun).toContain("d4-kubernetes");
    expect(D4_ARTIFACT_PATHS.curlProof).toContain("curl-proof.txt");
  });

  it("lists all manifest files", () => {
    expect(D4_MANIFESTS).toHaveLength(6);
    expect(D4_MANIFESTS[0]).toContain("namespace.yaml");
  });

  it("points verify command at verify.sh", () => {
    expect(D4_VERIFY_CMD).toContain("verify.sh");
  });
});
