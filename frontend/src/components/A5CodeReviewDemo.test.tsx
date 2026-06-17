import { describe, expect, it } from "vitest";
import { A5CodeReviewDemo } from "./A5CodeReviewDemo";

describe("A5CodeReviewDemo", () => {
  it("exports a demo component function", () => {
    expect(A5CodeReviewDemo).toBeTypeOf("function");
  });
});
