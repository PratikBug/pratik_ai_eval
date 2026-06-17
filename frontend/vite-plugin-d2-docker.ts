import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function runE2e(scriptPath: string): { output: string; exitCode: number } {
  const result = spawnSync("bash", [scriptPath], {
    encoding: "utf-8",
    timeout: 900_000,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { output, exitCode: result.status ?? 1 };
}

export function d2DockerPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const e2eScript = path.join(taskDir, "scripts/e2e.sh");
  const e2eOutputPath = path.join(taskDir, "artifacts/e2e-output.txt");
  const serviceLogsPath = path.join(taskDir, "artifacts/service-logs.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method !== "POST" || url !== "/api/d2/e2e") {
      next();
      return;
    }

    try {
      if (!fs.existsSync(e2eScript)) {
        sendJson(res, 500, { error: "e2e.sh not found" });
        return;
      }

      const { output, exitCode } = runE2e(e2eScript);

      sendJson(res, 200, {
        output,
        exitCode,
        e2eOutput: fs.existsSync(e2eOutputPath)
          ? fs.readFileSync(e2eOutputPath, "utf-8")
          : undefined,
        serviceLogs: fs.existsSync(serviceLogsPath)
          ? fs.readFileSync(serviceLogsPath, "utf-8")
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "D2 e2e failed";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "d2-docker-compose",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
