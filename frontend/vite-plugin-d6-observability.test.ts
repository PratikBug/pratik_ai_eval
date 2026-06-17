import { describe, expect, it } from "vitest";

describe("vite-plugin-d6-observability", () => {
  it("registers d6 observability route", () => {
    expect("/api/d6/observability").toMatch(/^\/api\/d6\/observability$/);
  });
});
