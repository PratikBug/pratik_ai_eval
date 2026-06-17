import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/a6-performance-profiling-and-targeted-improvement";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function parseBenchmarkOutput(output: string) {
  const read = (key: string) => {
    const match = output.match(new RegExp(`${key}=([\\d.]+)`));
    return match ? Number(match[1]) : null;
  };
  return {
    baselineMs: read("baseline_mean_ms"),
    afterMs: read("after_mean_ms"),
    improvementPct: read("improvement_pct"),
    productCount: read("products") ?? 2000,
    iterations: read("iterations") ?? 5,
  };
}

function parseReportSummary(markdown: string) {
  const improvementMatch = markdown.match(/\*\*(\d+\.?\d*)% faster\*\*/);
  const baselineMatch = markdown.match(/(\d+\.?\d*) ms → (\d+\.?\d*) ms/);
  return {
    bottleneck: "N+1 SQLite queries in fetch_summaries_n_plus_one",
    improvementPct: improvementMatch ? Number(improvementMatch[1]) : 0,
    baselineMs: baselineMatch ? Number(baselineMatch[1]) : undefined,
    afterMs: baselineMatch ? Number(baselineMatch[2]) : undefined,
  };
}

function countPassedTests(output: string): number {
  const match = output.match(/(\d+) passed/);
  return match ? Number(match[1]) : 0;
}

export function a6PerformancePlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const reportPath = path.join(taskDir, "artifacts/performance-report.md");
  const benchmarkScript = path.join(taskDir, "profile-target/benchmark.py");
  const profileTargetDir = path.join(taskDir, "profile-target");

  const handler = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "GET" && url === "/api/a6/report") {
      try {
        if (!fs.existsSync(reportPath)) {
          sendJson(res, 404, { error: "Performance report not found." });
          return;
        }
        const report = fs.readFileSync(reportPath, "utf-8");
        sendJson(res, 200, {
          report,
          summary: parseReportSummary(report),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load report";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a6/run-benchmark") {
      try {
        if (!fs.existsSync(benchmarkScript)) {
          sendJson(res, 404, { error: "Benchmark script not found." });
          return;
        }
        const result = spawnSync("python3", [benchmarkScript, "--mode", "both"], {
          encoding: "utf-8",
          timeout: 120_000,
          cwd: profileTargetDir,
        });
        const output = (result.stdout || result.stderr || "").trim();
        const parsed = parseBenchmarkOutput(output);
        sendJson(res, 200, {
          mode: "both",
          ...parsed,
          output,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Benchmark failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a6/run-tests") {
      try {
        const result = spawnSync("python3", ["-m", "pytest", "-q"], {
          encoding: "utf-8",
          timeout: 120_000,
          cwd: profileTargetDir,
        });
        const output = (result.stdout || result.stderr || "").trim();
        const exitCode = result.status ?? 1;
        sendJson(res, 200, {
          exitCode,
          output,
          passed: exitCode === 0,
          passedCount: countPassedTests(output),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tests failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "a6-performance",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
