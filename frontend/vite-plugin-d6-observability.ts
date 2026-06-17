import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function runScript(scriptPath: string, repoRoot: string): { output: string; exitCode: number } {
  const pathParts = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    process.env.PATH ?? "",
  ].filter(Boolean);

  const result = spawnSync("bash", [scriptPath], {
    encoding: "utf-8",
    timeout: 900_000,
    cwd: repoRoot,
    env: {
      ...process.env,
      PATH: pathParts.join(":"),
    },
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { output, exitCode: result.status ?? 1 };
}

export function d6ObservabilityPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const verifyScript = path.join(taskDir, "scripts/verify.sh");
  const dashboardPanelPath = path.join(taskDir, "artifacts/dashboard-panel.json");
  const loadOutputPath = path.join(taskDir, "artifacts/load-output.txt");
  const metricsSamplePath = path.join(taskDir, "artifacts/metrics-sample.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method !== "POST" || url !== "/api/d6/observability") {
      next();
      return;
    }

    try {
      if (!fs.existsSync(verifyScript)) {
        sendJson(res, 500, { error: "verify.sh not found" });
        return;
      }

      const { output, exitCode } = runScript(verifyScript, repoRoot);

      sendJson(res, 200, {
        output,
        exitCode,
        dashboardPanel: fs.existsSync(dashboardPanelPath)
          ? fs.readFileSync(dashboardPanelPath, "utf-8")
          : undefined,
        loadOutput: fs.existsSync(loadOutputPath)
          ? fs.readFileSync(loadOutputPath, "utf-8")
          : undefined,
        metricsSample: fs.existsSync(metricsSamplePath)
          ? fs.readFileSync(metricsSamplePath, "utf-8")
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "D6 observability run failed";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "d6-observability",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
