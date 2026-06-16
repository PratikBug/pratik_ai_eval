import { describe, expect, it } from "vitest";
import { B1_EXAMPLE_REPO_URL } from "../lib/bitbucketUrl";

describe("B2EndpointDemo", () => {
  it("uses the same public Bitbucket example URL as B1 for endpoint demos", () => {
    expect(B1_EXAMPLE_REPO_URL).toContain("bitbucket.org/ramram43210/java_spring_2019");
  });
});
