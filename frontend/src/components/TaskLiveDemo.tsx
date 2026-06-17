import type { ComponentType } from "react";
import { A2WorktreeDemo } from "./A2WorktreeDemo";
import { A3PolyglotDemo } from "./A3PolyglotDemo";
import { A4ModernizationDemo } from "./A4ModernizationDemo";
import { A5CodeReviewDemo } from "./A5CodeReviewDemo";
import { A6PerformanceDemo } from "./A6PerformanceDemo";
import { B1InventoryDemo } from "./B1InventoryDemo";
import { B2EndpointDemo } from "./B2EndpointDemo";
import { B3TestDiscoveryDemo } from "./B3TestDiscoveryDemo";
import { B4FastApiDemo } from "./B4FastApiDemo";
import { B5NodeApiDemo } from "./B5NodeApiDemo";
import { B6RustDemo } from "./B6RustDemo";
import { I1ErDiagramDemo } from "./I1ErDiagramDemo";
import { I2FlowTraceDemo } from "./I2FlowTraceDemo";
import { I3SafeChangeDemo } from "./I3SafeChangeDemo";
import { I4PolyglotDemo } from "./I4PolyglotDemo";
import { I5DockerDemo } from "./I5DockerDemo";
import { I6BugDiagnosisDemo } from "./I6BugDiagnosisDemo";
import { PendingTaskDemo } from "./PendingTaskDemo";
import type { Task } from "../types/tasks";

const LIVE_DEMOS: Record<string, ComponentType> = {
  B1: B1InventoryDemo,
  B2: B2EndpointDemo,
  B3: B3TestDiscoveryDemo,
  B4: B4FastApiDemo,
  B5: B5NodeApiDemo,
  B6: B6RustDemo,
  I1: I1ErDiagramDemo,
  I2: I2FlowTraceDemo,
  I3: I3SafeChangeDemo,
  I4: I4PolyglotDemo,
  I5: I5DockerDemo,
  I6: I6BugDiagnosisDemo,
  A2: A2WorktreeDemo,
  A3: A3PolyglotDemo,
  A4: A4ModernizationDemo,
  A5: A5CodeReviewDemo,
  A6: A6PerformanceDemo,
};

export const TASK_DEMO_IDS = Object.keys(LIVE_DEMOS);

interface TaskLiveDemoProps {
  task: Task;
}

export function TaskLiveDemo({ task }: TaskLiveDemoProps) {
  const Demo = LIVE_DEMOS[task.id];
  if (Demo) {
    return <Demo />;
  }
  return <PendingTaskDemo task={task} />;
}
