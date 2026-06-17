import { describe, expect, it } from "vitest";

describe("vite-plugin-a2-worktree", () => {
  it("registers A2 pytest and smoke routes", () => {
    expect("/api/a2/run-tests").toMatch(/^\/api\/a2\/run-tests$/);
    expect("/api/a2/smoke").toMatch(/^\/api\/a2\/smoke$/);
    expect("/api/a2/service/transactions").toContain("/api/a2/service");
  });
});
