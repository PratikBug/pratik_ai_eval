#!/usr/bin/env bash
# Install macOS Zscaler (or system) root CA into a kind node for Docker Hub pulls.
set -euo pipefail

CLUSTER_NAME="${D4_KIND_CLUSTER:-d4-jobs}"
NODE="${CLUSTER_NAME}-control-plane"

if ! docker ps --format '{{.Names}}' | grep -qx "${NODE}"; then
  echo "ERROR: kind node container '${NODE}' not running." >&2
  exit 1
fi

CERT_TMP="$(mktemp)"
trap 'rm -f "${CERT_TMP}"' EXIT

if security find-certificate -c "Zscaler Root CA" -p > "${CERT_TMP}" 2>/dev/null && [[ -s "${CERT_TMP}" ]]; then
  echo "Found Zscaler Root CA in macOS keychain."
elif security find-certificate -a -p /Library/Keychains/System.keychain > "${CERT_TMP}" 2>/dev/null; then
  echo "Using system keychain certificates (Zscaler not found by name)."
else
  echo "WARNING: Could not export root CA — kind may fail to pull public images." >&2
  exit 0
fi

docker exec "${NODE}" mkdir -p /usr/local/share/ca-certificates
docker cp "${CERT_TMP}" "${NODE}:/usr/local/share/ca-certificates/zscaler-root-ca.crt"
docker exec "${NODE}" update-ca-certificates
docker exec "${NODE}" systemctl restart containerd 2>/dev/null || true

echo "Verifying registry access from kind node..."
if docker exec "${NODE}" curl -sSI https://registry-1.docker.io/v2/ 2>&1 | grep -qE "HTTP/[0-9.]+ (200|401)"; then
  echo "SUCCESS — kind node can reach Docker Hub."
else
  echo "WARNING — registry still unreachable from kind node." >&2
fi
