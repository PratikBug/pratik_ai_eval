import { describe, expect, it } from "vitest";
import {
  I5_ARTIFACT_PATHS,
  I5_DOCKER_BUILD_CMD,
  I5_DOCKER_IMAGE,
  I5_SERVICE_PORT,
} from "./i5Docker";

describe("i5Docker", () => {
  it("documents the convert API image and port", () => {
    expect(I5_DOCKER_IMAGE).toContain("pratik-i5-convert-api");
    expect(I5_SERVICE_PORT).toBe(8080);
  });

  it("includes docker build command with I4 api context", () => {
    expect(I5_DOCKER_BUILD_CMD).toContain("docker build");
    expect(I5_DOCKER_BUILD_CMD).toContain("i4-polyglot-service-pair");
  });

  it("points to build and curl proof artifacts", () => {
    expect(I5_ARTIFACT_PATHS.buildProof).toContain("build-proof.txt");
    expect(I5_ARTIFACT_PATHS.curlProof).toContain("curl-proof.txt");
    expect(I5_ARTIFACT_PATHS.dockerfile).toContain("Dockerfile");
  });
});
