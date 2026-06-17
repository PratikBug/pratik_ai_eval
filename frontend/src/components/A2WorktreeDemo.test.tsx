import { describe, expect, it } from "vitest";
import { A2_SERVICE_BASE } from "../types/a2Worktree";

describe("A2WorktreeDemo", () => {
  it("targets the merged A2 sandbox via vite proxy", () => {
    expect(`${A2_SERVICE_BASE}/transactions`).toBe("/api/a2/service/transactions");
  });
});
