export const I3_CHANGE_BRANCH = "i3/case-insensitive-log-levels";

export const I3_TARGET_MODULE = {
  path: "tasks/b6-rust-greenfield",
  file: "src/lib.rs",
  change: "Case-insensitive log level token matching (info/Warn/error)",
  function: "line_contains_level",
} as const;

export interface I3ChangedFile {
  path: string;
  why: string;
}

export const I3_CHANGED_FILES: I3ChangedFile[] = [
  {
    path: "tasks/b6-rust-greenfield/src/lib.rs",
    why: "Only token-matching logic; added counts_case_insensitive_log_levels test",
  },
];

export const I3_TEST_COMMAND = "cd tasks/b6-rust-greenfield && cargo test";

export const I3_AGENT_VS_MANUAL = [
  {
    topic: "Scope",
    agent: "Change line_contains_level only (1 line)",
    manual: "Confirmed no other token matchers in crate",
  },
  {
    topic: "Testing",
    agent: "Add unit test for mixed-case input",
    manual: "Full cargo test — 7/7 passed",
  },
  {
    topic: "False positives",
    agent: "Token split avoids information → INFO",
    manual: "Reviewed alphanumeric boundary behavior",
  },
  {
    topic: "Integration",
    agent: "No CLI changes required",
    manual: "cli_integration tests still green",
  },
] as const;

export const I3_ARTIFACT_PATHS = {
  changeSummary: "tasks/i3-small-safe-change-in-unfamiliar-repo/artifacts/change-summary.md",
  riskAssessment: "tasks/i3-small-safe-change-in-unfamiliar-repo/artifacts/risk-assessment.md",
  changePatch: "tasks/i3-small-safe-change-in-unfamiliar-repo/artifacts/change.patch",
  testOutput: "tasks/i3-small-safe-change-in-unfamiliar-repo/artifacts/test-output.txt",
} as const;

export const I3_CHANGE_VIEWS = [
  { id: "summary", label: "Change summary" },
  { id: "risk", label: "Risk assessment" },
  { id: "patch", label: "Diff / patch" },
  { id: "tests", label: "Test output" },
] as const;

export type I3ChangeView = (typeof I3_CHANGE_VIEWS)[number]["id"];
