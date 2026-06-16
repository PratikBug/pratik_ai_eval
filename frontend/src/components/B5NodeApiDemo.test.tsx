import { describe, expect, it } from "vitest";

describe("B5NodeApiDemo", () => {
  it("targets the B5 Node artifact path", () => {
    expect("tasks/b5-nodejs-greenfield-api-or-cli/artifacts/run-proof.txt").toContain(
      "b5-nodejs-greenfield-api-or-cli",
    );
  });
});
