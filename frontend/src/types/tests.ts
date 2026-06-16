export interface TestFileEntry {
  path: string;
  category: "plugin" | "component" | "page" | "lib";
}

export interface TestDiscoveryData {
  framework: string;
  frameworkVersion: string | null;
  configFile: string;
  packageScript: string;
  environment: string;
  command: string;
  testFiles: TestFileEntry[];
  savedDiscoveryPath: string;
  savedOutputPath: string;
}

export interface TestRunSummary {
  testFilesPassed: number | null;
  testFilesTotal: number | null;
  testsPassed: number | null;
  testsTotal: number | null;
  durationMs: number | null;
  passed: boolean;
}

export interface TestRunResponse {
  discovery: TestDiscoveryData;
  output: string;
  exitCode: number;
  summary: TestRunSummary;
  savedOutput?: string;
  savedDiscovery?: string;
}

const VITEST_FILES_RE = /Test Files\s+(\d+) passed(?: \((\d+)\))?/;
const VITEST_TESTS_RE = /Tests\s+(\d+) passed(?: \((\d+)\))?/;
const VITEST_DURATION_RE = /Duration\s+([\d.]+)s/;

export function parseVitestOutput(output: string, exitCode: number): TestRunSummary {
  const filesMatch = output.match(VITEST_FILES_RE);
  const testsMatch = output.match(VITEST_TESTS_RE);
  const durationMatch = output.match(VITEST_DURATION_RE);

  const testFilesPassed = filesMatch ? Number(filesMatch[1]) : null;
  const testFilesTotal = filesMatch?.[2] ? Number(filesMatch[2]) : testFilesPassed;
  const testsPassed = testsMatch ? Number(testsMatch[1]) : null;
  const testsTotal = testsMatch?.[2] ? Number(testsMatch[2]) : testsPassed;
  const durationMs = durationMatch ? Math.round(Number(durationMatch[1]) * 1000) : null;

  return {
    testFilesPassed,
    testFilesTotal,
    testsPassed,
    testsTotal,
    durationMs,
    passed: exitCode === 0,
  };
}

export function categorizeTestFile(relativePath: string): TestFileEntry["category"] {
  if (relativePath.startsWith("vite-plugin-")) return "plugin";
  if (relativePath.includes("/components/")) return "component";
  if (relativePath.includes("/pages/")) return "page";
  return "lib";
}
