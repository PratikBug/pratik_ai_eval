import { describe, expect, it } from "vitest";
import { A3_DEFAULT_EVENT, A3_SERVICE_BASE, A3_TASK_SLUG } from "./a3Fraud";

describe("a3Fraud types", () => {
  it("exports service base and task slug", () => {
    expect(A3_SERVICE_BASE).toBe("/api/a3/service");
    expect(A3_TASK_SLUG).toContain("a3-polyglot");
  });

  it("defines default demo event", () => {
    expect(A3_DEFAULT_EVENT.transaction_id).toBeTruthy();
    expect(A3_DEFAULT_EVENT.amount).toBeGreaterThan(0);
    expect(A3_DEFAULT_EVENT.merchant_id).toBeTruthy();
  });
});
