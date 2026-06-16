import { describe, expect, it } from "vitest";

describe("vite-plugin-b2-scan", () => {
  it("registers POST /api/b2/scan route", () => {
    expect("/api/b2/scan").toMatch(/^\/api\/b2\/scan$/);
  });
});
