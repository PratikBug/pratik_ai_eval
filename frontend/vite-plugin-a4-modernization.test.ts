import { describe, expect, it } from "vitest";
import { a4ModernizationPlugin } from "./vite-plugin-a4-modernization";

describe("vite-plugin-a4-modernization", () => {
  it("registers the a4 modernization plugin", () => {
    const plugin = a4ModernizationPlugin("/tmp/repo");
    expect(plugin.name).toBe("a4-modernization");
  });
});
