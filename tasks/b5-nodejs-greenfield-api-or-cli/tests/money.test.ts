import { describe, expect, it } from "vitest";
import { formatMoney, parseAmount } from "../src/money.js";

describe("money helpers", () => {
  it("formats values with two decimal places", () => {
    expect(formatMoney(75.5)).toBe("75.50");
  });

  it("parses valid positive amounts", () => {
    expect(parseAmount("100.50")).toBe("100.50");
    expect(parseAmount(25)).toBe("25.00");
  });

  it("rejects zero and invalid values", () => {
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});
