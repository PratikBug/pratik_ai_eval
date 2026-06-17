import { describe, expect, it } from "vitest";
import { TASK_DEMO_IDS } from "./TaskLiveDemo";
import { listTaskArchitectureIds } from "../pages/taskArchitectures";

describe("TaskLiveDemo", () => {
  it("registers live demos for completed interactive tasks", () => {
    expect(TASK_DEMO_IDS).toEqual(
      expect.arrayContaining(["B1", "B2", "B3", "B4", "B5", "B6", "I1", "I2", "I3", "I4", "I5", "I6", "A2", "A3", "A4", "A5", "A6", "D1", "D2", "D3", "D4"]),
    );
  });

  it("covers every task id via live demo or architecture preview fallback", () => {
    const allTaskIds = listTaskArchitectureIds();
    expect(allTaskIds).toHaveLength(24);
    expect(TASK_DEMO_IDS.length).toBe(21);
    expect(allTaskIds.length - TASK_DEMO_IDS.length).toBe(3);
  });
});
