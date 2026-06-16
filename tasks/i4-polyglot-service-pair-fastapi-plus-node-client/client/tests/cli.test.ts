import { describe, expect, it } from "vitest";
import { buildConvertRequest, parseCliArgs } from "../src/cli";

describe("parseCliArgs", () => {
  it("parses amount and currency pair", () => {
    expect(parseCliArgs(["100", "USD", "EUR"])).toEqual({
      amount: 100,
      fromCurrency: "USD",
      toCurrency: "EUR",
      baseUrl: "http://127.0.0.1:8768",
    });
  });

  it("accepts custom base url flag", () => {
    expect(parseCliArgs(["50", "GBP", "INR", "--base-url", "http://localhost:9999"])).toEqual({
      amount: 50,
      fromCurrency: "GBP",
      toCurrency: "INR",
      baseUrl: "http://localhost:9999",
    });
  });

  it("rejects invalid amount", () => {
    expect(() => parseCliArgs(["abc", "USD", "EUR"])).toThrow(/amount/i);
  });
});

describe("buildConvertRequest", () => {
  it("builds API payload", () => {
    expect(
      buildConvertRequest({ amount: 10, fromCurrency: "USD", toCurrency: "EUR" }),
    ).toEqual({
      amount: 10,
      from_currency: "USD",
      to_currency: "EUR",
    });
  });
});
