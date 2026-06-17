export const D4_UP_CMD =
  "bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/up.sh";

export const D4_DOWN_CMD =
  "bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/down.sh";

export const D4_VERIFY_CMD =
  "bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/verify.sh";

export const D4_MANIFESTS = [
  "k8s/00-namespace.yaml",
  "k8s/10-configmap.yaml",
  "k8s/20-secret.yaml",
  "k8s/30-postgres.yaml",
  "k8s/40-api.yaml",
  "k8s/50-ingress.yaml",
];

export const D4_ARTIFACT_PATHS = {
  dryRun: "tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/artifacts/dry-run-output.txt",
  apply: "tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/artifacts/apply-output.txt",
  curlProof:
    "tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/artifacts/curl-proof.txt",
} as const;

export type D4K8sRunResponse = {
  output: string;
  exitCode: number;
  dryRunLog?: string;
  applyLog?: string;
  curlProof?: string;
};
