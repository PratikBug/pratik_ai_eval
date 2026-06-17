import { describe, expect, it } from "vitest";

describe("vite-plugin-d6-observability", () => {
  it("registers d6 observability routes", () => {
    expect("/api/d6/observability").toMatch(/^\/api\/d6\/observability$/);
    expect("/api/d6/status").toMatch(/^\/api\/d6\/status$/);
    expect("/api/d6/up").toMatch(/^\/api\/d6\/up$/);
  });
});
