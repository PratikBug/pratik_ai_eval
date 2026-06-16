import { describe, expect, it } from "vitest";
import { I2_FLOW_STEPS, I2_TRACE_TARGET } from "../types/i2FlowTrace";

describe("I2FlowTraceDemo", () => {
  it("traces B4 create transaction through store append", () => {
    expect(I2_TRACE_TARGET.path).toBe("/transactions");
    const storeStep = I2_FLOW_STEPS.find((step) => step.function.includes("TransactionStore.create"));
    expect(storeStep?.sideEffect).toBe(true);
  });
});
