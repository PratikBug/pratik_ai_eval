import { describe, expect, it } from "vitest";
import { parseCargoTestOutput, parseLogCounterOutput } from "./logCounter";

describe("logCounter types", () => {
  it("parses INFO/WARN/ERROR counts from CLI stdout", () => {
    const output = "INFO: 3\nWARN: 2\nERROR: 2";
    expect(parseLogCounterOutput(output)).toEqual({ info: 3, warn: 2, error: 2 });
  });

  it("parses cargo test summary from stdout", () => {
    const output = "test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.37s";
    const summary = parseCargoTestOutput(output, 0);
    expect(summary.passed).toBe(true);
    expect(summary.testsPassed).toBe(6);
  });
});
