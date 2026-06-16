export const I6_BUGGY_FILE = "tasks/i6-bug-diagnosis-with-agent/service/src/shipping.py";

export const I6_ROOT_CAUSE = {
  function: "calculate_shipping",
  line: "shipping.py (~line 11)",
  operator: ">",
  fix: ">=",
  summary: "Free shipping at $50.00+ but strict > excluded exactly 5000 cents",
} as const;

export const I6_VERIFY_CMD = "cd tasks/i6-bug-diagnosis-with-agent/service && pytest -v";

export const I6_REPRO_CMD =
  "python3 tasks/i6-bug-diagnosis-with-agent/scripts/show-buggy-behavior.py";

export const I6_AGENT_VS_MANUAL = [
  {
    topic: "Reproduction",
    agent: "Run test_free_shipping_at_exactly_fifty_dollars",
    manual: "show-buggy-behavior.py prints 599 vs 0 at $50.00",
  },
  {
    topic: "Root cause",
    agent: "Threshold uses > instead of >=",
    manual: "Confirmed at shipping.py boundary check",
  },
  {
    topic: "Fix",
    agent: "Single operator change only",
    manual: "No other files touched; patch is 1 line",
  },
  {
    topic: "Verification",
    agent: "pytest -v full suite",
    manual: "4/4 passed; fix-verification.txt saved",
  },
] as const;

export const I6_ARTIFACT_PATHS = {
  bugReport: "tasks/i6-bug-diagnosis-with-agent/artifacts/bug-report.md",
  seededPatch: "tasks/i6-bug-diagnosis-with-agent/artifacts/seeded-bug.patch",
  fixVerification: "tasks/i6-bug-diagnosis-with-agent/artifacts/fix-verification.txt",
  shippingSource: I6_BUGGY_FILE,
} as const;

export interface I6ScriptRunResponse {
  output: string;
  exitCode: number;
  mode: "show-bug" | "pytest";
}
