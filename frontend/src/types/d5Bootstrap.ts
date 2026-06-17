export const D5_BOOTSTRAP_CMD = "make bootstrap";

export const D5_VERIFY_CMD =
  "bash tasks/d5-reproducible-dev-environment-from-a-fresh-clone/scripts/verify.sh";

export const D5_MAKE_TARGETS = ["bootstrap", "test", "lint", "clean"] as const;

export const D5_ARTIFACT_PATHS = {
  bootstrapLog:
    "tasks/d5-reproducible-dev-environment-from-a-fresh-clone/artifacts/bootstrap-log.txt",
  testOutput:
    "tasks/d5-reproducible-dev-environment-from-a-fresh-clone/artifacts/test-output.txt",
  implicitDeps:
    "tasks/d5-reproducible-dev-environment-from-a-fresh-clone/artifacts/implicit-deps.md",
  miseToml: ".mise.toml",
  makefile: "Makefile",
} as const;

export type D5BootstrapRunResponse = {
  output: string;
  exitCode: number;
  bootstrapLog?: string;
  testOutput?: string;
};
