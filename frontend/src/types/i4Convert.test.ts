import { describe, expect, it } from "vitest";
import { I4_DEFAULT_CONVERT, I4_SERVICE_BASE, I4_SUPPORTED_CURRENCIES } from "./i4Convert";

describe("i4Convert", () => {
  it("uses proxied service base path", () => {
    expect(I4_SERVICE_BASE).toBe("/api/i4/service");
  });

  it("lists supported currencies", () => {
    expect(I4_SUPPORTED_CURRENCIES).toEqual(["USD", "EUR", "GBP", "INR"]);
  });

  it("provides default convert demo payload", () => {
    expect(I4_DEFAULT_CONVERT.amount).toBeGreaterThan(0);
    expect(I4_SUPPORTED_CURRENCIES).toContain(I4_DEFAULT_CONVERT.from_currency);
  });
});
