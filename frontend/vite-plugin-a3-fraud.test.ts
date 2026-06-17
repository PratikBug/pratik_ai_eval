import { describe, expect, it } from "vitest";
import { a3FraudPlugin } from "./vite-plugin-a3-fraud";

describe("vite-plugin-a3-fraud", () => {
  it("registers the a3 polyglot plugin", () => {
    const plugin = a3FraudPlugin("/tmp/repo");
    expect(plugin.name).toBe("a3-fraud-polyglot");
  });
});
