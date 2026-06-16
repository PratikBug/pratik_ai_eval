import { describe, expect, it } from "vitest";

describe("vite-plugin-b6-rust", () => {
  it("registers B6 cargo test and CLI routes", () => {
    expect("/api/b6/run-tests").toMatch(/^\/api\/b6\/run-tests$/);
    expect("/api/b6/run-cli").toMatch(/^\/api\/b6\/run-cli$/);
  });
});
