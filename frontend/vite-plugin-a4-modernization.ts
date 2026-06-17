import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const TASK_SLUG = "tasks/a4-repository-modernization-plan-with-executable-first-step";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function countTableRows(markdown: string, header: string): number {
  const section = markdown.split(header)[1]?.split("\n## ")[0] ?? "";
  return section.split("\n").filter((line) => line.startsWith("|") && !line.includes("---")).length - 1;
}

export function a4ModernizationPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const sandboxDir = path.join(taskDir, "legacy-sandbox");
  const planPath = path.join(taskDir, "artifacts/modernization-plan.md");
  const verifyScript = path.join(taskDir, "scripts/verify.sh");

  const handler = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "GET" && url === "/api/a4/plan") {
      try {
        if (!fs.existsSync(planPath)) {
          sendJson(res, 404, { error: "Modernization plan not found." });
          return;
        }
        const plan = fs.readFileSync(planPath, "utf-8");
        sendJson(res, 200, {
          plan,
          summary: {
            firstStep: "Add pytest harness + GET /health endpoint",
            findingsCount: Math.max(0, countTableRows(plan, "## Findings")),
            backlogItems: Math.max(0, countTableRows(plan, "## Prioritized backlog")),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load plan";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a4/verify") {
      try {
        if (!fs.existsSync(verifyScript)) {
          sendJson(res, 404, { error: "Verification script not found." });
          return;
        }

        const result = spawnSync("bash", [verifyScript], {
          encoding: "utf-8",
          timeout: 120_000,
          cwd: taskDir,
        });

        const output = (result.stdout || result.stderr || "").trim();
        const exitCode = result.status ?? 1;

        sendJson(res, 200, {
          exitCode,
          output,
          passed: exitCode === 0,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Verification failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "GET" && url === "/api/a4/sandbox-health") {
      try {
        const venvPython = path.join(sandboxDir, ".venv/bin/python");
        if (!fs.existsSync(venvPython)) {
          spawnSync("python3", ["-m", "venv", ".venv"], { cwd: sandboxDir });
          spawnSync(path.join(sandboxDir, ".venv/bin/pip"), ["install", "-q", "-r", "requirements-dev.txt"], {
            cwd: sandboxDir,
          });
        }

        const probe = spawnSync(
          venvPython,
          [
            "-c",
            "from app import app; c=app.test_client(); r=c.get('/health'); print(r.status_code, r.get_json())",
          ],
          { encoding: "utf-8", cwd: sandboxDir },
        );

        if (probe.status !== 0) {
          sendJson(res, 500, {
            error: (probe.stderr || probe.stdout || "Health probe failed").trim(),
          });
          return;
        }

        sendJson(res, 200, {
          ok: true,
          probe: probe.stdout.trim(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sandbox health check failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "a4-modernization",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
