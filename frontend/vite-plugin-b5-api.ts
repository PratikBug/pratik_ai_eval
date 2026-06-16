import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { Plugin } from "vite";
import { parseVitestOutput } from "./src/types/tests";

const B5_PORT = 8767;
const SERVICE_PREFIX = "/api/b5/service";

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
    const request = http.get(`http://127.0.0.1:${B5_PORT}/health`, (response) => {
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
          reject(new Error("Node.js API did not become ready in time."));
          return;
        }
        setTimeout(poll, delayMs);
      });
    };

    poll();
  });
}

export function b5NodeApiPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, "tasks/b5-nodejs-greenfield-api-or-cli");
  const tsxBin = path.join(taskDir, "node_modules/.bin/tsx");
  let serverProc: ChildProcess | null = null;
  let starting: Promise<void> | null = null;

  function startServer(): Promise<void> {
    if (starting) return starting;

    starting = (async () => {
      if (await checkHealth()) return;

      if (!fs.existsSync(tsxBin)) {
        throw new Error(
          "B5 dependencies not installed. Run: cd tasks/b5-nodejs-greenfield-api-or-cli && npm install",
        );
      }

      serverProc = spawn(tsxBin, ["src/index.ts"], {
        cwd: taskDir,
        stdio: "ignore",
        env: { ...process.env, PORT: String(B5_PORT) },
      });

      serverProc.on("exit", () => {
        serverProc = null;
        starting = null;
      });

      await waitForHealth();
    })();

    return starting;
  }

  function stopServer() {
    if (serverProc && !serverProc.killed) {
      serverProc.kill("SIGTERM");
      serverProc = null;
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
      port: B5_PORT,
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

    if (req.method === "POST" && url === "/api/b5/run-tests") {
      try {
        if (!fs.existsSync(path.join(taskDir, "node_modules"))) {
          sendJson(res, 500, {
            error:
              "B5 dependencies not installed. Run: cd tasks/b5-nodejs-greenfield-api-or-cli && npm install",
          });
          return;
        }

        const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
        const result = spawnSync(npmCmd, ["test"], {
          encoding: "utf-8",
          timeout: 180_000,
          cwd: taskDir,
          shell: process.platform === "win32",
        });

        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;
        const proofPath = path.join(taskDir, "artifacts/run-proof.txt");

        sendJson(res, 200, {
          output,
          exitCode,
          summary: parseVitestOutput(output, exitCode),
          savedProof: fs.existsSync(proofPath) ? fs.readFileSync(proofPath, "utf-8") : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Vitest run failed";
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
        const message = error instanceof Error ? error.message : "Node.js API unavailable";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "b5-node-api",
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
