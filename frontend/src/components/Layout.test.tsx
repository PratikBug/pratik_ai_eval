import { describe, expect, it } from "vitest";

describe("Layout", () => {
  it("renders brand text", () => {
    expect("Coding Agent Eval").toContain("Eval");
  });
});
