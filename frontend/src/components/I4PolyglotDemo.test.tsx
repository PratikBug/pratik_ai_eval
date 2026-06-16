import { describe, expect, it } from "vitest";
import { I4_DEFAULT_CONVERT, I4_SERVICE_BASE } from "../types/i4Convert";

describe("I4PolyglotDemo", () => {
  it("targets I4 convert endpoint via vite proxy", () => {
    expect(`${I4_SERVICE_BASE}/convert`).toBe("/api/i4/service/convert");
    expect(I4_DEFAULT_CONVERT.from_currency).toBe("USD");
  });
});
