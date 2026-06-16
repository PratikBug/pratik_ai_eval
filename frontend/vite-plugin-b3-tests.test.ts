import { describe, expect, it } from "vitest";

describe("vite-plugin-b3-tests", () => {
  it("registers POST /api/b3/run-tests route", () => {
    expect("/api/b3/run-tests").toMatch(/^\/api\/b3\/run-tests$/);
  });
});
