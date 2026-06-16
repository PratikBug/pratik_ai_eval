import { describe, expect, it } from "vitest";

describe("B4FastApiDemo", () => {
  it("targets the B4 FastAPI task artifact path", () => {
    expect("tasks/b4-fastapi-greenfield-service/artifacts/run-proof.txt").toContain(
      "b4-fastapi-greenfield-service",
    );
  });
});
