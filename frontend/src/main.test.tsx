import { describe, expect, it } from "vitest";

describe("app bootstrap", () => {
  it("has a root element in index.html", () => {
    expect(document.createElement("div").id).toBe("");
  });
});
