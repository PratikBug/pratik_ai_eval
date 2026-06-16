import { describe, expect, it } from "vitest";
import { I5_SERVICE_PORT } from "../types/i5Docker";

describe("I5DockerDemo", () => {
  it("exposes convert API on standard container port", () => {
    expect(I5_SERVICE_PORT).toBe(8080);
  });
});
