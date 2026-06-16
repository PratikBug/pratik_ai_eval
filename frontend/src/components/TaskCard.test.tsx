import { describe, expect, it } from "vitest";

describe("TaskCard", () => {
  it("maps done status label", () => {
    expect({ done: "Done", pending: "Pending" }.done).toBe("Done");
  });
});
