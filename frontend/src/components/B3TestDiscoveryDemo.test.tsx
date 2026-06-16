import { describe, expect, it } from "vitest";

describe("B3TestDiscoveryDemo", () => {
  it("uses the B3 test discovery artifact paths", () => {
    expect("tasks/b3-test-discovery-and-execution/artifacts/test-discovery.md").toContain(
      "b3-test-discovery-and-execution",
    );
    expect("tasks/b3-test-discovery-and-execution/artifacts/test-run-output.txt").toContain(
      "test-run-output.txt",
    );
  });
});
