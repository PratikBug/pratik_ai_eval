import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard";
const GRAFANA_URL = "http://127.0.0.1:3000/d/d6-job-api/d6-job-api";
const GRAFANA_URL_PUBLIC = "http://localhost:3000/d/d6-job-api/d6-job-api";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function shellEnv() {
  const pathParts = ["/opt/homebrew/bin", "/usr/local/bin", process.env.PATH ?? ""].filter(Boolean);
  return {
    ...process.env,
    PATH: pathParts.join(":"),
  };
}

function runScript(scriptPath: string, repoRoot: string): { output: string; exitCode: number } {
  const result = spawnSync("bash", [scriptPath], {
    encoding: "utf-8",
    timeout: 900_000,
    cwd: repoRoot,
    env: shellEnv(),
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { output, exitCode: result.status ?? 1 };
}

function dockerRunning(): boolean {
  const result = spawnSync("docker", ["info"], {
    encoding: "utf-8",
    timeout: 15_000,
    env: shellEnv(),
  });
  return result.status === 0;
}

function grafanaReachable(): boolean {
  const result = spawnSync("curl", ["-sf", "-o", "/dev/null", GRAFANA_URL], {
    encoding: "utf-8",
    timeout: 10_000,
    env: shellEnv(),
  });
  return result.status === 0;
}

function stackStatus() {
  const dockerOk = dockerRunning();
  const grafanaOk = dockerOk && grafanaReachable();
  return {
    dockerRunning: dockerOk,
    grafanaReachable: grafanaOk,
    grafanaUrl: GRAFANA_URL_PUBLIC,
    hint: dockerOk
      ? grafanaOk
        ? undefined
        : "Docker is running but Grafana is not up. Click Start stack."
      : "Docker daemon is not running. Run: colima start",
  };
}

export function d6ObservabilityPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const verifyScript = path.join(taskDir, "scripts/verify.sh");
  const upScript = path.join(taskDir, "scripts/up.sh");
  const dashboardPanelPath = path.join(taskDir, "artifacts/dashboard-panel.json");
  const loadOutputPath = path.join(taskDir, "artifacts/load-output.txt");
  const metricsSamplePath = path.join(taskDir, "artifacts/metrics-sample.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "GET" && url === "/api/d6/status") {
      sendJson(res, 200, stackStatus());
      return;
    }

    if (req.method === "POST" && url === "/api/d6/up") {
      try {
        if (!fs.existsSync(upScript)) {
          sendJson(res, 500, { error: "up.sh not found" });
          return;
        }
        const { output, exitCode } = runScript(upScript, repoRoot);
        sendJson(res, 200, { output, exitCode, ...stackStatus() });
      } catch (error) {
        const message = error instanceof Error ? error.message : "D6 stack start failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

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
