import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import {
  categorizeTestFile,
  parseVitestOutput,
  type TestDiscoveryData,
  type TestFileEntry,
} from "./src/types/tests";

const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx)$/;

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function walkTestFiles(dir: string, baseDir: string, results: TestFileEntry[]): void {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTestFiles(fullPath, baseDir, results);
      continue;
    }

    if (!TEST_FILE_RE.test(entry.name)) continue;

    const relativePath = path.relative(baseDir, fullPath).split(path.sep).join("/");
    results.push({
      path: relativePath,
      category: categorizeTestFile(relativePath),
    });
  }
}

function discoverTests(frontendDir: string, repoRoot: string): TestDiscoveryData {
  const packageJsonPath = path.join(frontendDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const testFiles: TestFileEntry[] = [];
  walkTestFiles(frontendDir, frontendDir, testFiles);
  testFiles.sort((a, b) => a.path.localeCompare(b.path));

  const vitestVersion = packageJson.devDependencies?.vitest?.replace(/^\^/, "") ?? null;

  return {
    framework: "Vitest",
    frameworkVersion: vitestVersion,
    configFile: "frontend/vite.config.ts",
    packageScript: packageJson.scripts?.test ?? "vitest run",
    environment: "jsdom",
    command: "cd frontend && npm test",
    testFiles,
    savedDiscoveryPath: "tasks/b3-test-discovery-and-execution/artifacts/test-discovery.md",
    savedOutputPath: "tasks/b3-test-discovery-and-execution/artifacts/test-run-output.txt",
  };
}

function readArtifact(repoRoot: string, relativePath: string): string | undefined {
  const filePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(filePath)) return undefined;
  return fs.readFileSync(filePath, "utf-8");
}

export function b3TestApiPlugin(repoRoot: string): Plugin {
  const frontendDir = path.join(repoRoot, "frontend");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    if (req.method !== "POST" || req.url !== "/api/b3/run-tests") {
      next();
      return;
    }

    try {
      const discovery = discoverTests(frontendDir, repoRoot);
      const result = spawnSync("npm", ["test"], {
        encoding: "utf-8",
        timeout: 180_000,
        cwd: frontendDir,
        shell: process.platform === "win32",
      });

      const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      const exitCode = result.status ?? 1;
      const summary = parseVitestOutput(output, exitCode);

      sendJson(res, 200, {
        discovery,
        output,
        exitCode,
        summary,
        savedDiscovery: readArtifact(repoRoot, discovery.savedDiscoveryPath),
        savedOutput: readArtifact(repoRoot, discovery.savedOutputPath),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected test run error";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "b3-test-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
