import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/d3-ci-pipeline-that-lints-tests-and-builds-an-image";

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
      NODE_ENV: "development",
    },
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { output, exitCode: result.status ?? 1 };
}

export function d3CiPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const localCiScript = path.join(taskDir, "scripts/run-local-ci.sh");
  const ciRunLogPath = path.join(taskDir, "artifacts/ci-run-log.txt");
  const ciFailureLogPath = path.join(taskDir, "artifacts/ci-failure-log.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method !== "POST" || url !== "/api/d3/ci") {
      next();
      return;
    }

    try {
      if (!fs.existsSync(localCiScript)) {
        sendJson(res, 500, { error: "run-local-ci.sh not found" });
        return;
      }

      const { output, exitCode } = runScript(localCiScript, repoRoot);

      if (output) {
        fs.writeFileSync(ciRunLogPath, output);
      }

      sendJson(res, 200, {
        output,
        exitCode,
        ciRunLog: fs.existsSync(ciRunLogPath)
          ? fs.readFileSync(ciRunLogPath, "utf-8")
          : output,
        ciFailureLog: fs.existsSync(ciFailureLogPath)
          ? fs.readFileSync(ciFailureLogPath, "utf-8")
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "D3 CI run failed";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "d3-ci",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
