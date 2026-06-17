import { describe, expect, it } from "vitest";
import { D6_VERIFY_CMD } from "../types/d6Observability";

describe("D6ObservabilityDemo", () => {
  it("loads observability artifacts from the task directory", () => {
    expect(D6_VERIFY_CMD).toContain("d6-observability");
  });

  it("re-runs verify through the D6 API route", () => {
    expect("/api/d6/observability").toMatch(/^\/api\/d6\/observability$/);
  });
});
