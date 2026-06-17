import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { Plugin } from "vite";
import { parseCargoTestOutput } from "./src/types/logCounter";
import { parsePytestOutput } from "./src/types/ledger";
import { parseVitestOutput } from "./src/types/tests";

const TASK_SLUG = "tasks/a3-polyglot-mini-system-fastapi-node-worker-rust-engine";
const ENGINE_PORT = 8782;
const WORKER_PORT = 8781;
const API_PORT = 8780;
const SERVICE_PREFIX = "/api/a3/service";

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

function checkHealth(port: number, pathName = "/health"): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${port}${pathName}`, (response) => {
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

function waitForHealth(port: number, label: string, maxAttempts = 40): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = () => {
      attempts += 1;
      void checkHealth(port).then((healthy) => {
        if (healthy) {
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(new Error(`${label} did not become ready on port ${port}.`));
          return;
        }
        setTimeout(poll, 250);
      });
    };

    poll();
  });
}

function ensureApiVenv(apiDir: string): { python: string; uvicorn: string } {
  const venvPython = path.join(apiDir, ".venv/bin/python");
  const venvUvicorn = path.join(apiDir, ".venv/bin/uvicorn");
  const requirements = path.join(apiDir, "requirements.txt");

  if (!fs.existsSync(venvPython)) {
    const venvResult = spawnSync("python3", ["-m", "venv", ".venv"], {
      cwd: apiDir,
      encoding: "utf-8",
    });
    if (venvResult.status !== 0) {
      throw new Error((venvResult.stderr || venvResult.stdout || "Failed to create venv").trim());
    }
  }

  if (fs.existsSync(requirements)) {
    const pipResult = spawnSync(venvPython, ["-m", "pip", "install", "-q", "-r", "requirements.txt"], {
      cwd: apiDir,
      encoding: "utf-8",
      timeout: 180_000,
    });
    if (pipResult.status !== 0) {
      throw new Error((pipResult.stderr || pipResult.stdout || "pip install failed").trim());
    }
  }

  return { python: venvPython, uvicorn: venvUvicorn };
}

function httpJson(
  method: string,
  port: number,
  targetPath: string,
  payload?: unknown,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : "";
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port,
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

export function a3FraudPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const engineDir = path.join(taskDir, "engine");
  const workerDir = path.join(taskDir, "worker");
  const apiDir = path.join(taskDir, "api");
  const proofPath = path.join(taskDir, "artifacts/run-proof.txt");

  let engineProc: ChildProcess | null = null;
  let workerProc: ChildProcess | null = null;
  let apiProc: ChildProcess | null = null;
  let starting: Promise<void> | null = null;

  function stopAll() {
    for (const proc of [apiProc, workerProc, engineProc]) {
      if (proc && !proc.killed) proc.kill("SIGTERM");
    }
    apiProc = null;
    workerProc = null;
    engineProc = null;
    starting = null;
  }

  function startStack(): Promise<void> {
    if (starting) return starting;

    starting = (async () => {
      if (await checkHealth(API_PORT)) return;

      engineProc = spawn("cargo", ["run", "--quiet", "--", "serve"], {
        cwd: engineDir,
        stdio: "ignore",
        env: { ...process.env, ENGINE_PORT: String(ENGINE_PORT) },
      });
      engineProc.on("exit", () => {
        engineProc = null;
      });
      await waitForHealth(ENGINE_PORT, "Rust engine");

      workerProc = spawn("npx", ["tsx", "src/server.ts"], {
        cwd: workerDir,
        stdio: "ignore",
        shell: true,
        env: {
          ...process.env,
          WORKER_PORT: String(WORKER_PORT),
          ENGINE_URL: `http://127.0.0.1:${ENGINE_PORT}/score`,
        },
      });
      workerProc.on("exit", () => {
        workerProc = null;
      });
      await waitForHealth(WORKER_PORT, "Node worker");

      const { uvicorn } = ensureApiVenv(apiDir);
      apiProc = spawn(
        uvicorn,
        ["src.main:app", "--host", "127.0.0.1", "--port", String(API_PORT)],
        {
          cwd: apiDir,
          stdio: "ignore",
          env: {
            ...process.env,
            WORKER_URL: `http://127.0.0.1:${WORKER_PORT}/internal/process`,
          },
        },
      );
      apiProc.on("exit", () => {
        apiProc = null;
        starting = null;
      });
      await waitForHealth(API_PORT, "FastAPI");
    })();

    return starting;
  }

  function proxyToService(
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    targetPath: string,
    body: string,
  ) {
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: API_PORT,
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

    if (req.method === "POST" && url === "/api/a3/run-engine-tests") {
      try {
        const result = spawnSync("cargo", ["test"], {
          encoding: "utf-8",
          timeout: 300_000,
          cwd: engineDir,
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;
        sendJson(res, 200, {
          output,
          exitCode,
          summary: parseCargoTestOutput(output, exitCode),
          savedProof: fs.existsSync(proofPath) ? fs.readFileSync(proofPath, "utf-8") : undefined,
        });
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : "cargo test failed" });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a3/run-worker-tests") {
      try {
        const result = spawnSync("npm", ["test"], {
          encoding: "utf-8",
          timeout: 180_000,
          cwd: workerDir,
          shell: true,
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;
        sendJson(res, 200, {
          output,
          exitCode,
          summary: parseVitestOutput(output, exitCode),
        });
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : "worker tests failed" });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a3/run-api-tests") {
      try {
        const { python } = ensureApiVenv(apiDir);
        const result = spawnSync(python, ["-m", "pytest", "tests/", "-v"], {
          encoding: "utf-8",
          timeout: 180_000,
          cwd: apiDir,
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;
        sendJson(res, 200, {
          output,
          exitCode,
          summary: parsePytestOutput(output, exitCode),
        });
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : "API tests failed" });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/a3/smoke") {
      try {
        await startStack();
        const txId = `a3-smoke-${Date.now()}`;
        const steps = [];

        const health = await httpJson("GET", API_PORT, "/health");
        steps.push({ label: "GET /health", status: health.status, body: health.body });

        const event = await httpJson("POST", API_PORT, "/events", {
          transaction_id: txId,
          amount: 150,
          merchant_id: "m-42",
        });
        steps.push({ label: "POST /events", status: event.status, body: event.body });

        const score = await httpJson("GET", API_PORT, `/scores/${txId}`);
        steps.push({ label: `GET /scores/${txId}`, status: score.status, body: score.body });

        const exitCode = steps.every((step) => step.status >= 200 && step.status < 300) ? 0 : 1;
        sendJson(res, 200, { steps, exitCode });
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : "Smoke test failed" });
      }
      return;
    }

    if (url.startsWith(SERVICE_PREFIX)) {
      try {
        await startStack();
        const targetPath = url.slice(SERVICE_PREFIX.length) || "/";
        const body = req.method === "POST" || req.method === "PUT" ? await readBody(req) : "";
        proxyToService(req, res, targetPath, body);
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : "A3 stack unavailable" });
      }
      return;
    }

    next();
  };

  return {
    name: "a3-fraud-polyglot",
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
      stopAll();
    },
  };
}
