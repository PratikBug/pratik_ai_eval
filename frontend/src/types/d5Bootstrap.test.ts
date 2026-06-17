import { describe, expect, it } from "vitest";
import {
  D5_ARTIFACT_PATHS,
  D5_BOOTSTRAP_CMD,
  D5_MAKE_TARGETS,
} from "./d5Bootstrap";

describe("d5Bootstrap types", () => {
  it("defines artifact paths under the D5 task folder", () => {
    expect(D5_ARTIFACT_PATHS.bootstrapLog).toContain("d5-reproducible");
    expect(D5_ARTIFACT_PATHS.implicitDeps).toContain("implicit-deps.md");
  });

  it("lists make targets", () => {
    expect(D5_MAKE_TARGETS).toContain("bootstrap");
    expect(D5_MAKE_TARGETS).toContain("test");
  });

  it("points bootstrap command at make bootstrap", () => {
    expect(D5_BOOTSTRAP_CMD).toBe("make bootstrap");
  });
});
