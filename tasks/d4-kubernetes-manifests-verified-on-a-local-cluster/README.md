# D4 — Kubernetes Manifests Verified on a Local Cluster

**Time box:** 60 minutes  
**Status:** Done

## Goal

Kubernetes manifests (Deployment, Service, ConfigMap, optional Ingress) for the **D2 job API** stack, validated with dry-run, deployed on **kind**, and proven with `curl` via port-forward.

## Service

Deploys the D2 FastAPI job queue API (`pratik-d2-job-api:d4`) plus Postgres 16 in namespace `d4-jobs`. ConfigMap holds app settings and Postgres init SQL; Secret holds DB credentials.

| Resource | File | Purpose |
|----------|------|---------|
| Namespace | `k8s/00-namespace.yaml` | Isolate `d4-jobs` workloads |
| ConfigMap | `k8s/10-configmap.yaml` | API env + Postgres init scripts |
| Secret | `k8s/20-secret.yaml` | DB credentials + `DATABASE_URL` |
| Deployment + Service | `k8s/30-postgres.yaml` | Postgres 16 with seeded schema |
| Deployment + Service | `k8s/40-api.yaml` | D2 job API on port 8090 |
| Ingress (optional) | `k8s/50-ingress.yaml` | `job-api.local` → job-api Service (requires nginx ingress controller) |

## Prerequisites

| Tool | Install |
|------|---------|
| **kubectl** | `brew install kubectl` |
| **kind** | `brew install kind` |
| **Docker** | Colima or Docker Desktop (running) |

Optional: `kubeval` (`brew install kubeval`) for schema validation.

**Corporate TLS (Zscaler):** If image pulls fail inside kind with `x509: certificate signed by unknown authority`, run:

```bash
bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/fix-kind-certs.sh
```

This installs the macOS root CA into the kind node (same pattern as D2's `fix-colima-certs.sh`).

## Quick start

From repo root:

```bash
# Full verify: dry-run → kind deploy → curl proof (writes artifacts/)
bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/verify.sh
```

### Up / down

```bash
# Create kind cluster, build image, apply manifests
bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/up.sh

# Port-forward and curl manually
kubectl port-forward -n d4-jobs svc/job-api 18090:8090
curl -fsS http://127.0.0.1:18090/health
curl -fsS http://127.0.0.1:18090/jobs

# Remove manifests (keeps kind cluster)
bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/down.sh

# Remove manifests AND delete kind cluster
D4_DELETE_CLUSTER=1 bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/down.sh
```

### Validate only (no cluster required for client dry-run)

```bash
bash tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/scripts/validate.sh
```

## Deliverables

### Manifest YAML files

```
k8s/
├── 00-namespace.yaml
├── 10-configmap.yaml
├── 20-secret.yaml
├── 30-postgres.yaml
├── 40-api.yaml
└── 50-ingress.yaml
```

### Dry-run / kubeval output

`artifacts/dry-run-output.txt` — from `kubectl apply --dry-run=client` (and server/kubeval when available).

### kubectl apply output

`artifacts/apply-output.txt` — cluster creation, image load, rollout status.

### curl / port-forward proof

`artifacts/curl-proof.txt` — pod/service status plus `/health` and `/jobs` responses.

## Minikube alternative

```bash
minikube start
eval $(minikube docker-env)
docker build -t pratik-d2-job-api:d4 tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api
kubectl apply -f tasks/d4-kubernetes-manifests-verified-on-a-local-cluster/k8s/
kubectl port-forward -n d4-jobs svc/job-api 18090:8090
curl http://127.0.0.1:18090/health
```

## Reviewer UI

Open task **D4** in the reviewer UI (`npm run dev`) and click **Re-run verify** to execute `verify.sh` and refresh artifacts.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `D4_KIND_CLUSTER` | `d4-jobs` | kind cluster name |
| `D4_LOCAL_PORT` | `18090` | Local port for port-forward curl |
| `D4_DELETE_CLUSTER` | `0` | Set to `1` in `down.sh` to delete kind cluster |
