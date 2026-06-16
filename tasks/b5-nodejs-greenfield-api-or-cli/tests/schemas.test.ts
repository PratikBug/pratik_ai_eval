import { describe, expect, it } from "vitest";
import { transactionCreateSchema } from "../src/schemas.js";

describe("transactionCreateSchema", () => {
  it("accepts valid credit payloads", () => {
    const parsed = transactionCreateSchema.parse({
      amount: "10.00",
      type: "credit",
      description: "note",
    });
    expect(parsed.amount).toBe("10.00");
    expect(parsed.type).toBe("credit");
  });

  it("rejects invalid transaction types", () => {
    expect(() =>
      transactionCreateSchema.parse({ amount: "10.00", type: "transfer" }),
    ).toThrow();
  });
});
