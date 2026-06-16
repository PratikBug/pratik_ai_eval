import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { parsePytestOutput } from "./src/types/ledger";

const TASK_SLUG = "tasks/i6-bug-diagnosis-with-agent";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function i6BugPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const serviceDir = path.join(taskDir, "service");
  const showBugScript = path.join(taskDir, "scripts/show-buggy-behavior.py");
  const venvPython = path.join(serviceDir, ".venv/bin/python");
  const proofPath = path.join(taskDir, "artifacts/fix-verification.txt");

  const handler = (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "POST" && url === "/api/i6/show-bug") {
      try {
        const python = fs.existsSync(venvPython) ? venvPython : "python3";
        const result = spawnSync(python, [showBugScript], {
          encoding: "utf-8",
          timeout: 30_000,
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        sendJson(res, 200, { output, exitCode: result.status ?? 1, mode: "show-bug" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Show bug failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/i6/run-tests") {
      try {
        if (!fs.existsSync(venvPython)) {
          sendJson(res, 500, {
            error:
              "I6 venv not found. Run: cd tasks/i6-bug-diagnosis-with-agent/service && python3 -m venv .venv && pip install -r requirements.txt",
          });
          return;
        }

        const result = spawnSync(venvPython, ["-m", "pytest", "-v"], {
          encoding: "utf-8",
          timeout: 120_000,
          cwd: serviceDir,
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;

        sendJson(res, 200, {
          output,
          exitCode,
          mode: "pytest",
          summary: parsePytestOutput(output, exitCode),
          savedProof: fs.existsSync(proofPath) ? fs.readFileSync(proofPath, "utf-8") : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pytest run failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "i6-bug-diagnosis",
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
