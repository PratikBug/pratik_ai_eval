import { describe, expect, it } from "vitest";
import { B1_EXAMPLE_REPO_URL } from "../lib/bitbucketUrl";

describe("B1InventoryDemo", () => {
  it("uses a public Bitbucket example URL for reviewer demos", () => {
    expect(B1_EXAMPLE_REPO_URL).toContain("bitbucket.org/ramram43210/java_spring_2019");
    expect(B1_EXAMPLE_REPO_URL).toContain("/src/master/");
  });
});
