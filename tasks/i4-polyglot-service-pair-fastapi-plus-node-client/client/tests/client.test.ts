import { afterEach, describe, expect, it, vi } from "vitest";
import { convertCurrency } from "../src/client";

describe("convertCurrency", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to /convert and returns parsed response", async () => {
    const mockResponse = {
      amount: 100,
      from_currency: "USD",
      to_currency: "EUR",
      converted_amount: 91.7431,
      rate: 0.917431,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      }),
    );

    const result = await convertCurrency("http://127.0.0.1:8768", {
      amount: 100,
      from_currency: "USD",
      to_currency: "EUR",
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8768/convert",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.converted_amount).toBe(91.7431);
  });

  it("throws when API returns error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: "validation error" }),
      }),
    );

    await expect(
      convertCurrency("http://127.0.0.1:8768", {
        amount: 0,
        from_currency: "USD",
        to_currency: "EUR",
      }),
    ).rejects.toThrow(/422/);
  });
});
