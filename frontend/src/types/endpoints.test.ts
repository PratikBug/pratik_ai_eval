import { describe, expect, it } from "vitest";
import {
  ENDPOINT_ROUTE_KINDS,
  type EndpointScanResponse,
  summarizeEndpointScan,
} from "./endpoints";

describe("endpoints types", () => {
  it("defines route kind labels for summary cards", () => {
    expect(ENDPOINT_ROUTE_KINDS).toEqual(["api_routes", "frontend_routes", "static_routes"]);
  });

  it("summarizes endpoint counts from scan payload", () => {
    const payload: EndpointScanResponse = {
      endpoints: {
        root: "/tmp/repo",
        scanned_at: "2026-01-01T00:00:00Z",
        files_scanned: 10,
        api_routes: [{ kind: "api", method: "GET", path: "/x", handler: "h", file: "a.ts", line: 1, framework: "express", environment: "all", notes: null }],
        frontend_routes: [],
        static_routes: [],
      },
      apiReport: "# API",
      frontendReport: "# Frontend",
      summary: { api_routes: 0, frontend_routes: 0, static_routes: 0 },
    };

    const summary = summarizeEndpointScan(payload);
    expect(summary.api_routes).toBe(1);
    expect(summary.frontend_routes).toBe(0);
    expect(summary.static_routes).toBe(0);
  });
});
