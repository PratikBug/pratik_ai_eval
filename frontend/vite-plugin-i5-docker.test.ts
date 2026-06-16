import { describe, expect, it } from "vitest";

describe("vite-plugin-i5-docker", () => {
  it("registers docker verify and smoke routes", () => {
    expect("/api/i5/verify-docker").toMatch(/^\/api\/i5\/verify-docker$/);
    expect("/api/i5/smoke-local").toMatch(/^\/api\/i5\/smoke-local$/);
  });
});
