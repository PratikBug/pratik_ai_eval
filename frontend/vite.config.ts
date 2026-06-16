import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  plugins: [
    react(),
    {
      name: "serve-repo-artifacts",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split("?")[0] ?? "";
          if (!url.startsWith("/tasks/") && !url.startsWith("/docs/")) {
            next();
            return;
          }

          const filePath = path.join(repoRoot, url);
          if (!filePath.startsWith(repoRoot) || !fs.existsSync(filePath)) {
            next();
            return;
          }

          const ext = path.extname(filePath).toLowerCase();
          const type =
            ext === ".md"
              ? "text/markdown; charset=utf-8"
              : ext === ".json"
                ? "application/json; charset=utf-8"
                : "text/plain; charset=utf-8";

          res.setHeader("Content-Type", type);
          res.end(fs.readFileSync(filePath));
        });
      },
    },
  ],
  server: {
    port: 5173,
    fs: {
      allow: [repoRoot],
    },
  },
  test: {
    environment: "jsdom",
  },
});
