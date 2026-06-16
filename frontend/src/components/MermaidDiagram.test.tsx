import { describe, expect, it } from "vitest";
import { stripMermaidComments } from "../types/i1ErDiagram";

describe("MermaidDiagram", () => {
  it("uses comment-stripped source suitable for mermaid.render", () => {
    const source = `%% header
erDiagram
    TRANSACTION { int id PK }`;
    expect(stripMermaidComments(source)).toContain("erDiagram");
    expect(stripMermaidComments(source)).not.toContain("%%");
  });
});
