import { describe, expect, it } from "vitest";
import {
  A2_ARTIFACT_PATHS,
  A2_SERVICE_BASE,
  A2_TASK_SLUG,
  A2_WORKTREE_LANES,
} from "./a2Worktree";

describe("a2Worktree types", () => {
  it("points at the A2 sandbox and merge proof artifacts", () => {
    expect(A2_TASK_SLUG).toBe("tasks/a2-execute-two-parallel-worktrees");
    expect(A2_ARTIFACT_PATHS.mergeProof).toContain("merge-proof.md");
    expect(A2_SERVICE_BASE).toBe("/api/a2/service");
  });

  it("documents two parallel worktree lanes", () => {
    expect(A2_WORKTREE_LANES).toHaveLength(2);
    expect(A2_WORKTREE_LANES[0]?.branch).toBe("feat/a2-data-layer");
    expect(A2_WORKTREE_LANES[1]?.branch).toBe("feat/a2-api-endpoints");
  });
});
