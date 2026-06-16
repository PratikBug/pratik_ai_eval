import { describe, expect, it } from "vitest";
import { formatLedgerBalance, parsePytestOutput } from "./ledger";

describe("ledger types", () => {
  it("parses pytest summary from stdout", () => {
    const output = `
tests/test_api.py::test_post_transaction_creates_record PASSED
tests/test_api.py::test_get_balance_reflects_credits_and_debits PASSED
============================== 5 passed in 0.29s ===============================
`;
    const summary = parsePytestOutput(output, 0);
    expect(summary.passed).toBe(true);
    expect(summary.testsPassed).toBe(5);
  });

  it("formats balance for display", () => {
    expect(formatLedgerBalance({ balance: "74.50", currency: "USD" })).toBe("USD 74.50");
  });
});
