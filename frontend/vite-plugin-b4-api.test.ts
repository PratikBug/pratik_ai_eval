import { describe, expect, it } from "vitest";

describe("vite-plugin-b4-api", () => {
  it("registers B4 service proxy and pytest routes", () => {
    expect("/api/b4/run-tests").toMatch(/^\/api\/b4\/run-tests$/);
    expect("/api/b4/service/health").toMatch(/^\/api\/b4\/service\//);
  });
});
