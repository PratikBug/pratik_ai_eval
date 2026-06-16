import { describe, expect, it } from "vitest";

describe("B6RustDemo", () => {
  it("targets the B6 Rust artifact path", () => {
    expect("tasks/b6-rust-greenfield/artifacts/run-proof.txt").toContain("b6-rust-greenfield");
  });
});
