import { describe, expect, it } from "vitest";

describe("vite-plugin-d4-k8s", () => {
  it("registers d4 k8s route", () => {
    expect("/api/d4/k8s").toMatch(/^\/api\/d4\/k8s$/);
  });
});
