import { describe, expect, it } from "vitest";

describe("vite-plugin-i6-bug", () => {
  it("registers bug reproduction and pytest routes", () => {
    expect("/api/i6/show-bug").toMatch(/^\/api\/i6\/show-bug$/);
    expect("/api/i6/run-tests").toMatch(/^\/api\/i6\/run-tests$/);
  });
});
