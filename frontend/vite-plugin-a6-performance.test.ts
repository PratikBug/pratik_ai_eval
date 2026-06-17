import { describe, expect, it } from "vitest";
import { a6PerformancePlugin } from "./vite-plugin-a6-performance";

describe("vite-plugin-a6-performance", () => {
  it("registers the a6 performance plugin", () => {
    const plugin = a6PerformancePlugin("/tmp/repo");
    expect(plugin.name).toBe("a6-performance");
  });
});
