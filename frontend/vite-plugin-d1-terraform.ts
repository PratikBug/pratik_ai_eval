import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/d1-terraform-plan-for-a-small-service";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function runVerify(scriptPath: string): { output: string; exitCode: number } {
  const result = spawnSync("bash", [scriptPath], {
    encoding: "utf-8",
    timeout: 600_000,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { output, exitCode: result.status ?? 1 };
}

export function d1TerraformPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const verifyScript = path.join(taskDir, "scripts/verify.sh");
  const validatePath = path.join(taskDir, "artifacts/terraform-validate.txt");
  const planPath = path.join(taskDir, "artifacts/terraform-plan.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method !== "POST" || url !== "/api/d1/verify") {
      next();
      return;
    }

    try {
      if (!fs.existsSync(verifyScript)) {
        sendJson(res, 500, { error: "verify.sh not found" });
        return;
      }

      const { output, exitCode } = runVerify(verifyScript);

      sendJson(res, 200, {
        output,
        exitCode,
        validateOutput: fs.existsSync(validatePath)
          ? fs.readFileSync(validatePath, "utf-8")
          : undefined,
        planOutput: fs.existsSync(planPath) ? fs.readFileSync(planPath, "utf-8") : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "D1 verify failed";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "d1-terraform",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
