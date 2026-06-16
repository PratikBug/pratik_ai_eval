import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/i5-dockerize-and-run";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function runScript(scriptPath: string): { output: string; exitCode: number } {
  const result = spawnSync("bash", [scriptPath], {
    encoding: "utf-8",
    timeout: 600_000,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  return { output, exitCode: result.status ?? 1 };
}

function dockerAvailable(): boolean {
  const check = spawnSync("docker", ["info"], { encoding: "utf-8", timeout: 10_000 });
  return check.status === 0;
}

export function i5DockerPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const verifyScript = path.join(taskDir, "scripts/verify-docker.sh");
  const smokeScript = path.join(taskDir, "scripts/smoke-local.sh");
  const buildProofPath = path.join(taskDir, "artifacts/build-proof.txt");
  const curlProofPath = path.join(taskDir, "artifacts/curl-proof.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "POST" && url === "/api/i5/verify-docker") {
      try {
        if (!fs.existsSync(verifyScript)) {
          sendJson(res, 500, { error: "verify-docker.sh not found" });
          return;
        }

        const useDocker = dockerAvailable();
        const script = useDocker ? verifyScript : smokeScript;
        const { output, exitCode } = runScript(script);

        sendJson(res, 200, {
          output,
          exitCode,
          mode: useDocker ? "docker" : "smoke-local",
          savedBuildProof: fs.existsSync(buildProofPath)
            ? fs.readFileSync(buildProofPath, "utf-8")
            : undefined,
          savedCurlProof: fs.existsSync(curlProofPath)
            ? fs.readFileSync(curlProofPath, "utf-8")
            : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "I5 verify failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/i5/smoke-local") {
      try {
        const { output, exitCode } = runScript(smokeScript);
        sendJson(res, 200, {
          output,
          exitCode,
          mode: "smoke-local",
          savedCurlProof: fs.existsSync(curlProofPath)
            ? fs.readFileSync(curlProofPath, "utf-8")
            : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Smoke test failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "i5-docker",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res, next);
      });
    },
  };
}
