import { describe, expect, it } from "vitest";

describe("vite-plugin-d3-ci", () => {
  it("registers d3 ci route", () => {
    expect("/api/d3/ci").toMatch(/^\/api\/d3\/ci$/);
  });
});
