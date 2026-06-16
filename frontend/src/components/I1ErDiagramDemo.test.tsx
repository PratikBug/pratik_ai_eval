import { describe, expect, it } from "vitest";
import {
  I1_ENTITY_STATS,
  I1_ER_DIAGRAM_VIEWS,
  I1_TRANSACTION_FIELDS,
} from "../types/i1ErDiagram";

describe("I1ErDiagramDemo", () => {
  it("summarizes the Transaction entity for the eval repo", () => {
    expect(I1_ENTITY_STATS.logicalEntities).toBe(1);
    expect(I1_TRANSACTION_FIELDS).toHaveLength(4);
    expect(I1_TRANSACTION_FIELDS.map((field) => field.name)).toEqual([
      "id",
      "amount",
      "type",
      "description",
    ]);
  });

  it("offers rendered, source, and full inventory view modes", () => {
    expect(I1_ER_DIAGRAM_VIEWS).toHaveLength(3);
    expect(I1_ER_DIAGRAM_VIEWS[0].id).toBe("rendered");
  });
});
