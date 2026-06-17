import { describe, expect, it, vi } from "vitest";
import { callEngine, processTransaction } from "../src/process.js";

describe("worker process", () => {
  it("calls engine and returns process response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ score: 73, reasons: ["amount_band"] }),
    });

    const result = await processTransaction(
      { transaction_id: "tx-1", amount: 150, merchant_id: "m-42" },
      "http://engine/score",
      fetchMock as unknown as typeof fetch,
    );

    expect(result).toEqual({
      transaction_id: "tx-1",
      score: 73,
      reasons: ["amount_band"],
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("throws when engine fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(
      callEngine(
        { transaction_id: "tx-2", amount: 10, merchant_id: "x" },
        "http://engine/score",
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toThrow("Engine returned 500");
  });
});
