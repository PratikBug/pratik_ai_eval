import { describe, expect, it } from "vitest";
import { categorizeTestFile, parseVitestOutput } from "./tests";

describe("tests types", () => {
  it("parses Vitest summary lines from stdout", () => {
    const output = `
 Test Files  17 passed (17)
      Tests  29 passed (29)
   Duration  3.50s
`;
    const summary = parseVitestOutput(output, 0);
    expect(summary.passed).toBe(true);
    expect(summary.testFilesPassed).toBe(17);
    expect(summary.testFilesTotal).toBe(17);
    expect(summary.testsPassed).toBe(29);
    expect(summary.testsTotal).toBe(29);
    expect(summary.durationMs).toBe(3500);
  });

  it("marks failed runs when exit code is non-zero", () => {
    const summary = parseVitestOutput("AssertionError: expected true to be false", 1);
    expect(summary.passed).toBe(false);
  });

  it("categorizes test file paths for the discovery table", () => {
    expect(categorizeTestFile("vite-plugin-b2-scan.test.ts")).toBe("plugin");
    expect(categorizeTestFile("src/components/B1InventoryDemo.test.tsx")).toBe("component");
    expect(categorizeTestFile("src/pages/TaskListPage.test.tsx")).toBe("page");
    expect(categorizeTestFile("src/lib/bitbucketUrl.test.ts")).toBe("lib");
  });
});
