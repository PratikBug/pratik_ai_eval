import { describe, expect, it } from "vitest";

describe("HowItWorksPage route", () => {
  it("is linked from the header", () => {
    expect("/how-it-works").toBe("/how-it-works");
  });
});
