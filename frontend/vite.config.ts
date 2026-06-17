import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { b1ScanApiPlugin } from "./vite-plugin-b1-scan";
import { b2ScanApiPlugin } from "./vite-plugin-b2-scan";
import { b3TestApiPlugin } from "./vite-plugin-b3-tests";
import { b4FastApiPlugin } from "./vite-plugin-b4-api";
import { b5NodeApiPlugin } from "./vite-plugin-b5-api";
import { b6RustPlugin } from "./vite-plugin-b6-rust";
import { i4PolyglotApiPlugin } from "./vite-plugin-i4-api";
import { i5DockerPlugin } from "./vite-plugin-i5-docker";
import { i6BugPlugin } from "./vite-plugin-i6-bug";
import { a2WorktreePlugin } from "./vite-plugin-a2-worktree";
import { a3FraudPlugin } from "./vite-plugin-a3-fraud";
import { a4ModernizationPlugin } from "./vite-plugin-a4-modernization";
import { a5ReviewPlugin } from "./vite-plugin-a5-review";
import { a6PerformancePlugin } from "./vite-plugin-a6-performance";
import { d1TerraformPlugin } from "./vite-plugin-d1-terraform";
import { d2DockerPlugin } from "./vite-plugin-d2-docker";
import { d3CiPlugin } from "./vite-plugin-d3-ci";
import { d4K8sPlugin } from "./vite-plugin-d4-k8s";
import { d5BootstrapPlugin } from "./vite-plugin-d5-bootstrap";

const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  plugins: [
    react(),
    b1ScanApiPlugin(repoRoot),
    b2ScanApiPlugin(repoRoot),
    b3TestApiPlugin(repoRoot),
    b4FastApiPlugin(repoRoot),
    b5NodeApiPlugin(repoRoot),
    b6RustPlugin(repoRoot),
    i4PolyglotApiPlugin(repoRoot),
    i5DockerPlugin(repoRoot),
    i6BugPlugin(repoRoot),
    a2WorktreePlugin(repoRoot),
    a3FraudPlugin(repoRoot),
    a4ModernizationPlugin(repoRoot),
    a5ReviewPlugin(repoRoot),
    a6PerformancePlugin(repoRoot),
    d1TerraformPlugin(repoRoot),
    d2DockerPlugin(repoRoot),
    d3CiPlugin(repoRoot),
    d4K8sPlugin(repoRoot),
    d5BootstrapPlugin(repoRoot),
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
