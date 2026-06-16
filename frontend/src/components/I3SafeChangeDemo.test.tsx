import { describe, expect, it } from "vitest";
import { I3_CHANGED_FILES, I3_TARGET_MODULE } from "../types/i3SafeChange";

describe("I3SafeChangeDemo", () => {
  it("describes a minimal lib.rs change with test update", () => {
    expect(I3_TARGET_MODULE.change.toLowerCase()).toContain("case-insensitive");
    expect(I3_CHANGED_FILES[0].why).toContain("token-matching");
  });
});
