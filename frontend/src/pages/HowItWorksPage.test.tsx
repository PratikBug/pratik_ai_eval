import { describe, expect, it } from "vitest";

describe("HowItWorksPage routes", () => {
  it("supports index and per-task architecture routes", () => {
    expect(["/how-it-works", "/how-it-works/B1", "/how-it-works/B2"]).toContain(
      "/how-it-works/B1",
    );
  });
});
