import http from "node:http";
import { DEFAULT_WORKER_PORT, processTransaction, type ProcessRequest } from "./process.js";

function readJson<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}") as T);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "GET" && url === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (req.method === "POST" && url === "/internal/process") {
      try {
        const payload = await readJson<ProcessRequest>(req);
        if (!payload.transaction_id || payload.amount <= 0 || !payload.merchant_id) {
          sendJson(res, 422, { detail: "Invalid process payload" });
          return;
        }
        const result = await processTransaction(payload);
        sendJson(res, 200, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Worker failed";
        sendJson(res, 503, { detail: message });
      }
      return;
    }

    sendJson(res, 404, { detail: "Not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.WORKER_PORT ?? DEFAULT_WORKER_PORT);
  createServer().listen(port, "127.0.0.1", () => {
    console.log(`a3 worker listening on http://127.0.0.1:${port}`);
  });
}
