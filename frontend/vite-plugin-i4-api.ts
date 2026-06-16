import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { Plugin } from "vite";
import { parsePytestOutput } from "./src/types/ledger";
import { parseVitestOutput } from "./src/types/tests";

const I4_PORT = 8768;
const SERVICE_PREFIX = "/api/i4/service";
const TASK_SLUG = "tasks/i4-polyglot-service-pair-fastapi-plus-node-client";

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

function checkHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${I4_PORT}/health`, (response) => {
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

function waitForHealth(maxAttempts = 20, delayMs = 250): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = () => {
      attempts += 1;
      void checkHealth().then((healthy) => {
        if (healthy) {
          resolve();
          return;
        }
        if (attempts >= maxAttempts) {
          reject(new Error("I4 FastAPI service did not become ready in time."));
          return;
        }
        setTimeout(poll, delayMs);
      });
    };

    poll();
  });
}

export function i4PolyglotApiPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const apiDir = path.join(taskDir, "api");
  const clientDir = path.join(taskDir, "client");
  const venvPython = path.join(apiDir, ".venv/bin/python");
  const venvUvicorn = path.join(apiDir, ".venv/bin/uvicorn");
  const proofPath = path.join(taskDir, "artifacts/run-proof.txt");
  let uvicornProc: ChildProcess | null = null;
  let starting: Promise<void> | null = null;

  function startServer(): Promise<void> {
    if (starting) return starting;

    starting = (async () => {
      if (await checkHealth()) return;

      if (!fs.existsSync(venvPython)) {
        throw new Error(
          "I4 API virtualenv not found. Run: cd tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api && python3 -m venv .venv && pip install -r requirements.txt",
        );
      }

      uvicornProc = spawn(
        venvUvicorn,
        ["src.main:app", "--host", "127.0.0.1", "--port", String(I4_PORT)],
        { cwd: apiDir, stdio: "ignore", detached: false },
      );

      uvicornProc.on("exit", () => {
        uvicornProc = null;
        starting = null;
      });

      await waitForHealth();
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
      port: I4_PORT,
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

    if (req.method === "POST" && url === "/api/i4/run-api-tests") {
      try {
        if (!fs.existsSync(venvPython)) {
          sendJson(res, 500, {
            error:
              "I4 API virtualenv not found. Run: cd tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api && python3 -m venv .venv && pip install -r requirements.txt",
          });
          return;
        }

        const result = spawnSync(venvPython, ["-m", "pytest", "-v"], {
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
          savedProof: fs.existsSync(proofPath) ? fs.readFileSync(proofPath, "utf-8") : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pytest run failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/i4/run-client-tests") {
      try {
        const result = spawnSync("npm", ["test"], {
          encoding: "utf-8",
          timeout: 180_000,
          cwd: clientDir,
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
        const message = error instanceof Error ? error.message : "Client tests failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/i4/run-cli") {
      try {
        await startServer();
        const raw = await readBody(req);
        const payload = JSON.parse(raw || "{}") as {
          amount?: number;
          from_currency?: string;
          to_currency?: string;
        };
        const amount = String(payload.amount ?? 100);
        const from = payload.from_currency ?? "USD";
        const to = payload.to_currency ?? "EUR";

        const result = spawnSync(
          "npx",
          ["tsx", "src/cli.ts", amount, from, to, "--base-url", `http://127.0.0.1:${I4_PORT}`],
          { encoding: "utf-8", timeout: 60_000, cwd: clientDir, shell: true },
        );
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();

        sendJson(res, 200, {
          output,
          exitCode: result.status ?? 1,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "CLI run failed";
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
        const message = error instanceof Error ? error.message : "I4 FastAPI service unavailable";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "i4-polyglot-api",
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
