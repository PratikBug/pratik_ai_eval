import { describe, expect, it } from "vitest";

describe("server entry", () => {
  it("uses the default B5 port when PORT is unset", () => {
    expect(Number(process.env.PORT ?? 8767)).toBe(8767);
  });
});
