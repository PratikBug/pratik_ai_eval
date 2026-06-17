import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/d5-reproducible-dev-environment-from-a-fresh-clone";

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

export function d5BootstrapPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const verifyScript = path.join(taskDir, "scripts/verify.sh");
  const bootstrapLogPath = path.join(taskDir, "artifacts/bootstrap-log.txt");
  const testOutputPath = path.join(taskDir, "artifacts/test-output.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method !== "POST" || url !== "/api/d5/bootstrap") {
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
        bootstrapLog: fs.existsSync(bootstrapLogPath)
          ? fs.readFileSync(bootstrapLogPath, "utf-8")
          : output,
        testOutput: fs.existsSync(testOutputPath)
          ? fs.readFileSync(testOutputPath, "utf-8")
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "D5 bootstrap run failed";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "d5-bootstrap",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
