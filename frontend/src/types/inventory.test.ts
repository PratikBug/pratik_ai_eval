import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABELS,
  INVENTORY_CATEGORIES,
  type InventoryArtifact,
} from "./inventory";

describe("inventory types", () => {
  it("defines all expected categories", () => {
    expect(INVENTORY_CATEGORIES).toHaveLength(10);
    expect(CATEGORY_LABELS.classes).toBe("Classes");
    expect(CATEGORY_LABELS.utilities).toBe("Utilities");
  });

  it("accepts artifact shape", () => {
    const artifact: InventoryArtifact = {
      name: "UserService",
      kind: "class",
      file: "src/UserService.java",
      line: 12,
      language: "java",
      inferred: false,
    };
    expect(artifact.name).toBe("UserService");
  });
});
