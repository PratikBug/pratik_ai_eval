import { describe, expect, it } from "vitest";
import {
  I2_ARTIFACT_PATHS,
  I2_FLOW_STEPS,
  I2_FLOW_TRACE_VIEWS,
  I2_TRACE_TARGET,
} from "./i2FlowTrace";

describe("i2FlowTrace", () => {
  it("documents POST /transactions as the traced endpoint", () => {
    expect(I2_TRACE_TARGET.method).toBe("POST");
    expect(I2_TRACE_TARGET.path).toBe("/transactions");
    expect(I2_TRACE_TARGET.service).toContain("B4");
  });

  it("lists major steps from entry to in-memory side effect", () => {
    expect(I2_FLOW_STEPS.length).toBeGreaterThanOrEqual(6);
    expect(I2_FLOW_STEPS.some((step) => step.file.includes("store.py"))).toBe(true);
    expect(I2_FLOW_STEPS.some((step) => step.sideEffect)).toBe(true);
  });

  it("points to flow trace artifacts", () => {
    expect(I2_ARTIFACT_PATHS.flowTrace).toContain("flow-trace.md");
    expect(I2_ARTIFACT_PATHS.sequenceDiagram).toContain("sequence-diagram.mmd");
  });

  it("defines rendered, source, and full trace view modes", () => {
    expect(I2_FLOW_TRACE_VIEWS.map((view) => view.id)).toEqual([
      "rendered",
      "source",
      "trace",
    ]);
  });
});
