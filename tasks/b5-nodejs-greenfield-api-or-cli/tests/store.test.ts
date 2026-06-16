import { beforeEach, describe, expect, it } from "vitest";
import { resetStore, store } from "../src/store.js";

describe("transaction store", () => {
  beforeEach(() => resetStore());

  it("computes balance from credits and debits", () => {
    store.create({ amount: "100.00", type: "credit" });
    store.create({ amount: "30.00", type: "debit" });
    store.create({ amount: "5.50", type: "credit" });

    expect(store.balance()).toBe("75.50");
  });
});
