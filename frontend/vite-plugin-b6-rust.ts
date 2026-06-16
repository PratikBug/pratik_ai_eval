import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { parseCargoTestOutput } from "./src/types/logCounter";

const TASK_SLUG = "tasks/b6-rust-greenfield";

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: import("node:http").IncomingMessage): Promise<{ file?: string }> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}") as { file?: string });
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function ensureCargoProject(taskDir: string): string | null {
  if (!fs.existsSync(path.join(taskDir, "Cargo.toml"))) {
    return "B6 Cargo project not found under tasks/b6-rust-greenfield/";
  }
  return null;
}

function runCargo(taskDir: string, args: string[]) {
  return spawnSync("cargo", args, {
    encoding: "utf-8",
    timeout: 300_000,
    cwd: taskDir,
  });
}

export function b6RustPlugin(repoRoot: string): Plugin {
  const taskDir = path.join(repoRoot, TASK_SLUG);
  const proofPath = path.join(taskDir, "artifacts/run-proof.txt");

  const handler = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "POST" && url === "/api/b6/run-tests") {
      try {
        const missing = ensureCargoProject(taskDir);
        if (missing) {
          sendJson(res, 500, { error: missing });
          return;
        }

        const result = runCargo(taskDir, ["test"]);
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        const exitCode = result.status ?? 1;

        sendJson(res, 200, {
          output,
          exitCode,
          summary: parseCargoTestOutput(output, exitCode),
          savedProof: fs.existsSync(proofPath) ? fs.readFileSync(proofPath, "utf-8") : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "cargo test failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    if (req.method === "POST" && url === "/api/b6/run-cli") {
      try {
        const missing = ensureCargoProject(taskDir);
        if (missing) {
          sendJson(res, 500, { error: missing });
          return;
        }

        const payload = await readJsonBody(req);
        const file = (payload.file ?? "sample.log").trim() || "sample.log";
        const logPath = path.resolve(taskDir, file);

        if (!logPath.startsWith(taskDir)) {
          sendJson(res, 400, { error: "Log file must stay inside the B6 task directory." });
          return;
        }

        const command = `cargo run --quiet -- ${file}`;
        const result = runCargo(taskDir, ["run", "--quiet", "--", file]);
        const output = (result.stdout ?? "").trim();
        const stderr = (result.stderr ?? "").trim();
        const exitCode = result.status ?? 1;

        sendJson(res, 200, {
          output,
          stderr,
          exitCode,
          command,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "cargo run failed";
        sendJson(res, 500, { error: message });
      }
      return;
    }

    next();
  };

  return {
    name: "b6-rust-api",
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
  };
}
