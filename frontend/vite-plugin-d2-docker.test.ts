import { describe, expect, it } from "vitest";

describe("vite-plugin-d2-docker", () => {
  it("registers d2 e2e route", () => {
    expect("/api/d2/e2e").toMatch(/^\/api\/d2\/e2e$/);
  });
});
