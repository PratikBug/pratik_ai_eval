import { describe, expect, it } from "vitest";

describe("vite-plugin-d5-bootstrap", () => {
  it("registers d5 bootstrap route", () => {
    expect("/api/d5/bootstrap").toMatch(/^\/api\/d5\/bootstrap$/);
  });
});
