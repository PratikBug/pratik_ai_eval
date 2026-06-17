export const D6_VERIFY_CMD =
  "bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/verify.sh";

export const D6_UP_CMD =
  "bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/up.sh";

export const D6_DOWN_CMD =
  "bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/down.sh";

export const D6_LOAD_CMD =
  "bash tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/scripts/load.sh";

export const D6_GRAFANA_URL = "http://localhost:3000/d/d6-job-api/d6-job-api";

export const D6_ARTIFACT_PATHS = {
  dashboardPanel:
    "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/artifacts/dashboard-panel.json",
  instrumentationDiff:
    "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/artifacts/instrumentation-diff.patch",
  loadOutput:
    "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/artifacts/load-output.txt",
  metricsSample:
    "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/artifacts/metrics-sample.txt",
  structuredLogs:
    "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/artifacts/structured-log-sample.txt",
  compose: "tasks/d6-observability-bolt-on-with-metrics-and-a-dashboard/docker-compose.yml",
} as const;

export type D6ObservabilityRunResponse = {
  output: string;
  exitCode: number;
  dashboardPanel?: string;
  loadOutput?: string;
  metricsSample?: string;
};

export type D6StackStatusResponse = {
  dockerRunning: boolean;
  grafanaReachable: boolean;
  grafanaUrl: string;
  hint?: string;
};
