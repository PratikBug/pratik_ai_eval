import { describe, expect, it } from "vitest";
import { A3PolyglotDemo } from "./A3PolyglotDemo";

describe("A3PolyglotDemo", () => {
  it("exports a demo component", () => {
    expect(A3PolyglotDemo).toBeTypeOf("function");
  });
});
