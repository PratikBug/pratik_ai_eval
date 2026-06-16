import { describe, expect, it } from "vitest";
import {
  buildMermaidLiveUrl,
  I1_ARTIFACT_PATHS,
  I1_ENTITY_STATS,
  I1_ER_DIAGRAM_VIEWS,
  I1_TRANSACTION_FIELDS,
  stripMermaidComments,
} from "../types/i1ErDiagram";

describe("i1ErDiagram", () => {
  it("documents zero SQL tables and one logical entity", () => {
    expect(I1_ENTITY_STATS.sqlTables).toBe(0);
    expect(I1_ENTITY_STATS.logicalEntities).toBe(1);
    expect(I1_ENTITY_STATS.foreignKeys).toBe(0);
  });

  it("lists Transaction fields with primary key id", () => {
    const idField = I1_TRANSACTION_FIELDS.find((field) => field.name === "id");
    expect(idField?.nullable).toBe(false);
    expect(idField?.notes).toContain("PK");
  });

  it("points to I1 artifact paths", () => {
    expect(I1_ARTIFACT_PATHS.entities).toContain("entities.md");
    expect(I1_ARTIFACT_PATHS.diagram).toContain("er-diagram.mmd");
  });

  it("builds a Mermaid Live editor URL from diagram source", () => {
    const url = buildMermaidLiveUrl("erDiagram\n  TRANSACTION { int id PK }");
    expect(url).toMatch(/^https:\/\/mermaid\.live\/edit#base64:/);
  });

  it("strips Mermaid comment lines before rendering", () => {
    const raw = `%% I1 header
%% second comment
erDiagram
    TRANSACTION { int id PK }`;
    expect(stripMermaidComments(raw)).toBe(`erDiagram
    TRANSACTION { int id PK }`);
  });

  it("defines three ER diagram view modes", () => {
    expect(I1_ER_DIAGRAM_VIEWS.map((view) => view.id)).toEqual([
      "rendered",
      "source",
      "inventory",
    ]);
  });
});
