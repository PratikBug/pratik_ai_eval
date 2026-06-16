import { describe, expect, it } from "vitest";

describe("vite-plugin-i4-api", () => {
  it("registers I4 service proxy and test routes", () => {
    expect("/api/i4/run-api-tests").toMatch(/^\/api\/i4\/run-api-tests$/);
    expect("/api/i4/run-client-tests").toMatch(/^\/api\/i4\/run-client-tests$/);
    expect("/api/i4/run-cli").toMatch(/^\/api\/i4\/run-cli$/);
    expect("/api/i4/service/convert").toMatch(/^\/api\/i4\/service\//);
  });
});
