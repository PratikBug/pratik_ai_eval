import { describe, expect, it } from "vitest";
import { a5ReviewPlugin } from "./vite-plugin-a5-review";

describe("vite-plugin-a5-review", () => {
  it("registers the a5 review plugin", () => {
    const plugin = a5ReviewPlugin("/tmp/repo");
    expect(plugin.name).toBe("a5-review");
  });
});
