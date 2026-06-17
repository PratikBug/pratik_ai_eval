import { describe, expect, it } from "vitest";

describe("vite-plugin-d1-terraform", () => {
  it("registers terraform verify route", () => {
    expect("/api/d1/verify").toMatch(/^\/api\/d1\/verify$/);
  });
});
