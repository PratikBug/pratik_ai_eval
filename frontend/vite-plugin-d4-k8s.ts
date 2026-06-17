import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/d4-kubernetes-manifests-verified-on-a-local-cluster";

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

export function d4K8sPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const verifyScript = path.join(taskDir, "scripts/verify.sh");
  const dryRunPath = path.join(taskDir, "artifacts/dry-run-output.txt");
  const applyPath = path.join(taskDir, "artifacts/apply-output.txt");
  const curlPath = path.join(taskDir, "artifacts/curl-proof.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method !== "POST" || url !== "/api/d4/k8s") {
      next();
      return;
    }

    try {
      if (!fs.existsSync(verifyScript)) {
        sendJson(res, 500, { error: "verify.sh not found" });
        return;
      }

      const { output, exitCode } = runScript(verifyScript, repoRoot);

      if (output && fs.existsSync(path.join(taskDir, "artifacts"))) {
        const applyLog = fs.existsSync(applyPath) ? fs.readFileSync(applyPath, "utf-8") : output;
        fs.writeFileSync(applyPath, applyLog);
      }

      sendJson(res, 200, {
        output,
        exitCode,
        dryRunLog: fs.existsSync(dryRunPath) ? fs.readFileSync(dryRunPath, "utf-8") : undefined,
        applyLog: fs.existsSync(applyPath) ? fs.readFileSync(applyPath, "utf-8") : undefined,
        curlProof: fs.existsSync(curlPath) ? fs.readFileSync(curlPath, "utf-8") : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "D4 K8s verify failed";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "d4-k8s",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
