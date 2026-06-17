import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { Plugin } from "vite";
import { parsePytestOutput } from "./src/types/ledger";

const A2_PORT = 8775;
const SERVICE_PREFIX = "/api/a2/service";
const TASK_DIR = "tasks/a2-execute-two-parallel-worktrees/sandbox/expense-tracker";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function ensureVenv(taskDir: string): { python: string; uvicorn: string } {
  const venvPython = path.join(taskDir, ".venv/bin/python");
  const venvUvicorn = path.join(taskDir, ".venv/bin/uvicorn");
  const requirements = path.join(taskDir, "requirements.txt");

  if (!fs.existsSync(venvPython)) {
    const venvResult = spawnSync("python3", ["-m", "venv", ".venv"], {
      cwd: taskDir,
      encoding: "utf-8",
    });
    if (venvResult.status !== 0) {
      throw new Error(
        (venvResult.stderr || venvResult.stdout || "Failed to create venv").trim(),
      );
    }
  }

  if (fs.existsSync(requirements)) {
    const pipResult = spawnSync(venvPython, ["-m", "pip", "install", "-q", "-r", "requirements.txt"], {
      cwd: taskDir,
      encoding: "utf-8",
      timeout: 180_000,
    });
    if (pipResult.status !== 0) {
      throw new Error((pipResult.stderr || pipResult.stdout || "pip install failed").trim());
    }
  }

  return { python: venvPython, uvicorn: venvUvicorn };
}

function checkReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${A2_PORT}/transactions`, (response) => {
      resolve(response.statusCode === 200);
      response.resume();
    });
    request.on("error", () => resolve(false));
    request.setTimeout(1500, () => {
      request.destroy();
      resolve(false);
    });
  });
}

function waitForReady(maxAttempts = 24, delayMs = 250): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = () => {
      attempts += 1;
      void checkReady().then((ready) => {
        if (ready) {
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(new Error("A2 Expense Tracker API did not become ready in time."));
          return;
        }
        setTimeout(poll, delayMs);
      });
    };

    poll();
  });
}

function httpJson(
  method: string,
  targetPath: string,
  payload?: unknown,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : "";
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: A2_PORT,
      path: targetPath,
      method,
      headers: body
        ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
        : {},
    };

    const request = http.request(options, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(chunk as Buffer));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf-8");
        let parsed: unknown = text;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }
        resolve({ status: response.statusCode ?? 0, body: parsed });
      });
    });

    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

export function a2WorktreePlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_DIR);
  const proofPath = path.join(repoRoot, "tasks/a2-execute-two-parallel-worktrees/artifacts/final-test-output.txt");
  let uvicornProc: ChildProcess | null = null;
  let starting: Promise<void> | null = null;

  function startServer(): Promise<void> {
    if (starting) return starting;

    starting = (async () => {
      if (await checkReady()) return;

      const { uvicorn } = ensureVenv(taskDir);
      uvicornProc = spawn(
        uvicorn,
        ["app.main:app", "--host", "127.0.0.1", "--port", String(A2_PORT)],
        { cwd: taskDir, stdio: "ignore", detached: false },
      );

      uvicornProc.on("exit", () => {
        uvicornProc = null;
        starting = null;
      });

      await waitForReady();
    })();

    return starting;
  }

  function stopServer() {
    if (uvicornProc && !uvicornProc.killed) {
      uvicornProc.kill("SIGTERM");
      uvicornProc = null;
    }
    starting = null;
  }

  function proxyToService(
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    targetPath: string,
    body: string,
  ) {
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: A2_PORT,
      path: targetPath,
      method: req.method,
      headers: {
        ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {}),
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.statusCode = proxyRes.statusCode ?? 502;
      const chunks: Buffer[] = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk as Buffer));
      proxyRes.on("end", () => {
        const payload = Buffer.concat(chunks);
        if (proxyRes.headers["content-type"]) {
          res.setHeader("Content-Type", proxyRes.headers["content-type"]);
        }
        res.end(payload);
      });
    });

    proxyReq.on("error", (error) => {
      sendJson(res, 502, { error: error.message });
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  }

  const handler = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "POST" && url === "/api/a2/run-tests") {
      try {
        const { python } = ensureVenv(taskDir);
        const result = spawnSync(python, ["-m", "pytest", "tests/", "-v"], {
          encoding: "utf-8",
          timeout: 180_000,
          cwd: taskDir,
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;

        sendJson(res, 200, {
          output,
          exitCode,
          summary: parsePytestOutput(output, exitCode),
          savedProof: fs.existsSync(proofPath) ? fs.readFileSync(proofPath, "utf-8") : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pytest run failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a2/smoke") {
      try {
        await startServer();
        const steps = [];

        const create = await httpJson("POST", "/transactions", {
          amount: 42.5,
          category: "food",
          description: "A2 reviewer smoke",
        });
        steps.push({ label: "POST /transactions", status: create.status, body: create.body });

        const list = await httpJson("GET", "/transactions");
        steps.push({ label: "GET /transactions", status: list.status, body: list.body });

        const balance = await httpJson("GET", "/balance");
        steps.push({ label: "GET /balance", status: balance.status, body: balance.body });

        const exitCode = steps.every((step) => step.status >= 200 && step.status < 300) ? 0 : 1;
        sendJson(res, 200, { steps, exitCode });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Smoke test failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (url.startsWith(SERVICE_PREFIX)) {
      try {
        await startServer();
        const targetPath = url.slice(SERVICE_PREFIX.length) || "/";
        const body = req.method === "POST" || req.method === "PUT" ? await readBody(req) : "";
        proxyToService(req, res, targetPath, body);
      } catch (error) {
        const message = error instanceof Error ? error.message : "A2 API unavailable";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "a2-worktree-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next);
      });
    },
    closeBundle() {
      stopServer();
    },
  };
}
