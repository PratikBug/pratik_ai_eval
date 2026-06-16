import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { Plugin } from "vite";
import { parsePytestOutput } from "./src/types/ledger";

const B4_PORT = 8766;
const SERVICE_PREFIX = "/api/b4/service";

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
    const request = http.get(`http://127.0.0.1:${B4_PORT}/health`, (response) => {
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
          reject(new Error("FastAPI service did not become ready in time."));
          return;
        }
        setTimeout(poll, delayMs);
      });
    };

    poll();
  });
}

export function b4FastApiPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, "tasks/b4-fastapi-greenfield-service");
  const venvPython = path.join(taskDir, ".venv/bin/python");
  const venvUvicorn = path.join(taskDir, ".venv/bin/uvicorn");
  let uvicornProc: ChildProcess | null = null;
  let starting: Promise<void> | null = null;

  function startServer(): Promise<void> {
    if (starting) return starting;

    starting = (async () => {
      if (await checkHealth()) return;

      if (!fs.existsSync(venvPython)) {
        throw new Error(
          "B4 virtualenv not found. Run: cd tasks/b4-fastapi-greenfield-service && python3 -m venv .venv && pip install -r requirements.txt",
        );
      }

      uvicornProc = spawn(venvUvicorn, ["src.main:app", "--host", "127.0.0.1", `--port`, String(B4_PORT)], {
        cwd: taskDir,
        stdio: "ignore",
        detached: false,
      });

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
      port: B4_PORT,
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

    if (req.method === "POST" && url === "/api/b4/run-tests") {
      try {
        if (!fs.existsSync(venvPython)) {
          sendJson(res, 500, {
            error:
              "B4 virtualenv not found. Run: cd tasks/b4-fastapi-greenfield-service && python3 -m venv .venv && pip install -r requirements.txt",
          });
          return;
        }

        const result = spawnSync(venvPython, ["-m", "pytest", "-v"], {
          encoding: "utf-8",
          timeout: 180_000,
          cwd: taskDir,
        });
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;
        const proofPath = path.join(taskDir, "artifacts/run-proof.txt");

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

    if (url.startsWith(SERVICE_PREFIX)) {
      try {
        await startServer();
        const targetPath = url.slice(SERVICE_PREFIX.length) || "/";
        const body = req.method === "POST" || req.method === "PUT" ? await readBody(req) : "";
        proxyToService(req, res, targetPath, body);
      } catch (error) {
        const message = error instanceof Error ? error.message : "FastAPI service unavailable";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "b4-fastapi-api",
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
