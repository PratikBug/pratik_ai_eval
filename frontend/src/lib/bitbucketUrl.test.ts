import { describe, expect, it } from "vitest";
import {
  B1_EXAMPLE_REPO_URL,
  isBitbucketRepoUrl,
  validateBitbucketRepoUrl,
} from "./bitbucketUrl";

describe("bitbucketUrl", () => {
  it("accepts Bitbucket web URLs", () => {
    expect(isBitbucketRepoUrl("https://bitbucket.org/ramram43210/java_spring_2019")).toBe(true);
    expect(isBitbucketRepoUrl(B1_EXAMPLE_REPO_URL)).toBe(true);
  });

  it("accepts Bitbucket git URLs", () => {
    expect(isBitbucketRepoUrl("git@bitbucket.org:ramram43210/java_spring_2019.git")).toBe(true);
  });

  it("rejects non-Bitbucket URLs", () => {
    expect(isBitbucketRepoUrl("https://github.com/org/repo")).toBe(false);
    expect(isBitbucketRepoUrl("")).toBe(false);
  });

  it("returns validation errors for invalid input", () => {
    expect(validateBitbucketRepoUrl("")).toMatch(/paste/i);
    expect(validateBitbucketRepoUrl("https://github.com/org/repo")).toMatch(/bitbucket/i);
    expect(validateBitbucketRepoUrl(B1_EXAMPLE_REPO_URL)).toBeNull();
  });
});
