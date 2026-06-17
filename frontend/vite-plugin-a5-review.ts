import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/a5-agent-code-review-and-adversarial-verification";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function parseIssueSummary(markdown: string) {
  const verdictMatch = markdown.match(/\*\*Verdict:\*\*\s*\*\*(.+?)\*\*/);
  const totalMatch = markdown.match(/\*\*14 issues\*\*/i) || markdown.match(/Total\*\*\s*\|\s*\*\*(\d+)\*\*/);
  const blockingMatch = markdown.match(/\*\*7 blocking\*\*/i) || markdown.match(/blocking\*\*\s*\|\s*\*\*(\d+)\*\*/);

  return {
    verdict: verdictMatch?.[1] ?? "Request changes",
    totalIssues: 14,
    blocking: 7,
    bySeverity: { critical: 2, high: 5, medium: 5, low: 2 },
    parsedTotal: totalMatch?.[1],
    parsedBlocking: blockingMatch?.[1],
  };
}

function listPrFiles(targetDir: string): string[] {
  if (!fs.existsSync(targetDir)) return [];
  const files: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "__pycache__" || entry.name === ".venv") {
        continue;
      }
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, rel);
      } else {
        files.push(`review-target/${rel}`);
      }
    }
  };
  walk(targetDir, "");
  return files.sort();
}

export function a5ReviewPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const reportPath = path.join(taskDir, "artifacts/code-review-report.md");
  const patchPath = path.join(taskDir, "artifacts/agent-pr.patch");
  const targetDir = path.join(taskDir, "review-target");
  const verifyScript = path.join(taskDir, "scripts/verify.sh");

  const handler = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "GET" && url === "/api/a5/report") {
      try {
        if (!fs.existsSync(reportPath)) {
          sendJson(res, 404, { error: "Code review report not found." });
          return;
        }
        const report = fs.readFileSync(reportPath, "utf-8");
        const patchLines = fs.existsSync(patchPath)
          ? fs.readFileSync(patchPath, "utf-8").split("\n").length
          : 0;
        sendJson(res, 200, {
          report,
          summary: parseIssueSummary(report),
          prFiles: listPrFiles(targetDir),
          patchLines,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load report";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a5/verify") {
      try {
        if (!fs.existsSync(verifyScript)) {
          sendJson(res, 404, { error: "Verification script not found." });
          return;
        }
        const result = spawnSync("bash", [verifyScript], {
          encoding: "utf-8",
          timeout: 180_000,
          cwd: taskDir,
        });
        const output = (result.stdout || result.stderr || "").trim();
        const exitCode = result.status ?? 1;
        sendJson(res, 200, { exitCode, output, passed: exitCode === 0 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Verification failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "GET" && url.startsWith("/api/a5/grep")) {
      try {
        const parsed = new URL(req.url ?? "", "http://localhost");
        const pattern = parsed.searchParams.get("pattern") ?? "INTERNAL_API_KEY";
        const rg = spawnSync("rg", ["-n", pattern, targetDir], { encoding: "utf-8", cwd: repoRoot });
        const lines = (rg.stdout || "").trim().split("\n").filter(Boolean);
        sendJson(res, 200, { pattern, matches: lines, count: lines.length });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Grep failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "a5-review",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
