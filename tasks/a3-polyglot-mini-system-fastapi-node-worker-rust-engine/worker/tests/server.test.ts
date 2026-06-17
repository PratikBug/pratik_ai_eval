import { describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";

describe("worker server", () => {
  it("creates an http server instance", () => {
    const server = createServer();
    expect(server).toBeDefined();
    server.close();
  });
});
