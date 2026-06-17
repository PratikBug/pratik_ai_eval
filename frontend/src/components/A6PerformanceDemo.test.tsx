import { describe, expect, it } from "vitest";
import { A6PerformanceDemo } from "./A6PerformanceDemo";

describe("A6PerformanceDemo", () => {
  it("exports a demo component function", () => {
    expect(A6PerformanceDemo).toBeTypeOf("function");
  });
});
