import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Plugin } from "vite";

const BITBUCKET_URL =
  /^https?:\/\/bitbucket\.org\/[^/]+\/[^/]+(?:\/|$)/i;

interface ScanRequest {
  repoUrl?: string;
  branch?: string;
  useLocalRepo?: boolean;
}

function readJsonBody(req: import("node:http").IncomingMessage): Promise<ScanRequest> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}") as ScanRequest);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function b2ScanApiPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, "tasks/b2-api-endpoint-map");
  const scanScript = path.join(taskDir, "src/scan_endpoints.py");

  const handler = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    if (req.method !== "POST" || req.url !== "/api/b2/scan") {
      next();
      return;
    }

    try {
      const payload = await readJsonBody(req);
      const repoUrl = payload.repoUrl?.trim() ?? "";
      const branch = payload.branch?.trim();
      const useLocalRepo = payload.useLocalRepo === true;

      if (!useLocalRepo) {
        if (!repoUrl || !BITBUCKET_URL.test(repoUrl)) {
          sendJson(res, 400, {
            error:
              "Provide a valid Bitbucket URL such as https://bitbucket.org/workspace/repo, or set useLocalRepo to scan this eval repository.",
          });
          return;
        }
      }

      const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "b2-ui-scan-"));
      const args = [scanScript, "--output-dir", outputDir];

      if (useLocalRepo) {
        args.push("--root", repoRoot);
      } else {
        args.push("--repo-url", repoUrl);
        if (branch) {
          args.push("--branch", branch);
        }
      }

      const result = spawnSync("python3", args, {
        encoding: "utf-8",
        timeout: 180_000,
        cwd: taskDir,
      });

      if (result.status !== 0) {
        sendJson(res, 500, {
          error: (result.stderr || result.stdout || "Scan failed").trim(),
        });
        fs.rmSync(outputDir, { recursive: true, force: true });
        return;
      }

      const files = fs.readdirSync(outputDir);
      const jsonName = files.find((name) => name.endsWith("-endpoints.json"));
      const apiMdName = files.find((name) => name.endsWith("-api-endpoint-map.md"));
      const frontendMdName = files.find((name) => name.endsWith("-frontend-routes.md"));

      if (!jsonName || !apiMdName || !frontendMdName) {
        sendJson(res, 500, { error: "Scanner did not produce expected output files." });
        fs.rmSync(outputDir, { recursive: true, force: true });
        return;
      }

      const endpoints = JSON.parse(fs.readFileSync(path.join(outputDir, jsonName), "utf-8"));
      const apiReport = fs.readFileSync(path.join(outputDir, apiMdName), "utf-8");
      const frontendReport = fs.readFileSync(path.join(outputDir, frontendMdName), "utf-8");
      fs.rmSync(outputDir, { recursive: true, force: true });

      const summary = {
        api_routes: Array.isArray(endpoints.api_routes) ? endpoints.api_routes.length : 0,
        frontend_routes: Array.isArray(endpoints.frontend_routes)
          ? endpoints.frontend_routes.length
          : 0,
        static_routes: Array.isArray(endpoints.static_routes) ? endpoints.static_routes.length : 0,
      };

      sendJson(res, 200, { endpoints, apiReport, frontendReport, summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected scan error";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "b2-scan-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
