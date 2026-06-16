const BITBUCKET_WEB =
  /^https?:\/\/bitbucket\.org\/[^/]+\/[^/]+(?:\/|$)/i;
const BITBUCKET_GIT =
  /^(?:https?:\/\/bitbucket\.org\/[^/]+\/[^/.]+(?:\.git)?|git@bitbucket\.org:[^/]+\/[^/.]+(?:\.git)?)$/i;

export const PUBLIC_BITBUCKET_DEMO_REPOS = [
  {
    label: "Java Spring tutorials",
    url: "https://bitbucket.org/ramram43210/java_spring_2019/src/master/",
    branch: "master",
    note: "Public repo with services, controllers, models, and repositories.",
  },
  {
    label: "Spring OAuth2 example",
    url: "https://bitbucket.org/hascode/spring-oauth2-example.git",
    branch: undefined,
    note: "Smaller public Spring repo for a quick scan.",
  },
] as const;

/** Default reviewer demo URL — public, no Bitbucket login required. */
export const B1_EXAMPLE_REPO_URL = PUBLIC_BITBUCKET_DEMO_REPOS[0].url;

export function isBitbucketRepoUrl(url: string): boolean {
  const trimmed = url.trim();
  return BITBUCKET_WEB.test(trimmed) || BITBUCKET_GIT.test(trimmed);
}

export function validateBitbucketRepoUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Paste a Bitbucket repository URL to scan.";
  }
  if (!isBitbucketRepoUrl(trimmed)) {
    return "Use a Bitbucket URL such as https://bitbucket.org/workspace/repo or .../src/master/.";
  }
  return null;
}
