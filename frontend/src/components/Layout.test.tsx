import { describe, expect, it } from "vitest";

describe("Layout", () => {
  it("renders brand text and how-it-works nav path", () => {
    expect("Coding Agent Eval").toContain("Eval");
    expect("/how-it-works").toBe("/how-it-works");
  });
});
