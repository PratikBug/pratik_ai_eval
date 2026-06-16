import { describe, expect, it } from "vitest";

describe("vite-plugin-b5-api", () => {
  it("registers B5 service proxy and vitest routes", () => {
    expect("/api/b5/run-tests").toMatch(/^\/api\/b5\/run-tests$/);
    expect("/api/b5/service/health").toMatch(/^\/api\/b5\/service\//);
  });
});
