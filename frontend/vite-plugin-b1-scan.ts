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

export function b1ScanApiPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, "tasks/b1-repo-artifact-inventory");
  const scanScript = path.join(taskDir, "src/scan_repo.py");

  const handler = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    if (req.method !== "POST" || req.url !== "/api/b1/scan") {
      next();
      return;
    }

    try {
      const payload = await readJsonBody(req);
      const repoUrl = payload.repoUrl?.trim() ?? "";
      const branch = payload.branch?.trim();

      if (!repoUrl || !BITBUCKET_URL.test(repoUrl)) {
        sendJson(res, 400, {
          error:
            "Provide a valid Bitbucket URL such as https://bitbucket.org/workspace/repo",
        });
        return;
      }

      const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "b1-ui-scan-"));
      const args = [scanScript, "--repo-url", repoUrl, "--output-dir", outputDir];
      if (branch) {
        args.push("--branch", branch);
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
      const jsonName = files.find((name) => name.endsWith("-inventory.json"));
      const mdName = files.find((name) => name.endsWith("-inventory-report.md"));

      if (!jsonName || !mdName) {
        sendJson(res, 500, { error: "Scanner did not produce expected output files." });
        fs.rmSync(outputDir, { recursive: true, force: true});
        return;
      }

      const inventory = JSON.parse(fs.readFileSync(path.join(outputDir, jsonName), "utf-8"));
      const report = fs.readFileSync(path.join(outputDir, mdName), "utf-8");
      fs.rmSync(outputDir, { recursive: true, force: true });

      const summary = Object.fromEntries(
        [
          "classes",
          "interfaces",
          "services",
          "controllers",
          "models",
          "repositories",
          "jobs",
          "consumers",
          "configs",
          "utilities",
        ].map((key) => [key, Array.isArray(inventory[key]) ? inventory[key].length : 0]),
      );

      sendJson(res, 200, { inventory, report, summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected scan error";
      sendJson(res, 500, { error: message });
    }
  };

  return {
    name: "b1-scan-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
