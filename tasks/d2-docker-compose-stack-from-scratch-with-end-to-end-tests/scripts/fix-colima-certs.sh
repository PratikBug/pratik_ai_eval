#!/usr/bin/env bash
# Install macOS Zscaler (or system) root CA into Colima so docker pull works behind SSL inspection.
set -euo pipefail

if ! command -v colima >/dev/null 2>&1; then
  echo "ERROR: colima not found. Use Docker Desktop or install Colima." >&2
  exit 1
fi

if ! colima status >/dev/null 2>&1; then
  echo "Starting Colima..."
  colima start
fi

CERT_TMP="$(mktemp)"
trap 'rm -f "${CERT_TMP}"' EXIT

if security find-certificate -c "Zscaler Root CA" -p > "${CERT_TMP}" 2>/dev/null && [[ -s "${CERT_TMP}" ]]; then
  echo "Found Zscaler Root CA in macOS keychain."
elif security find-certificate -a -p /Library/Keychains/System.keychain > "${CERT_TMP}" 2>/dev/null; then
  echo "Using system keychain certificates (Zscaler not found by name)."
else
  echo "ERROR: Could not export a root CA from macOS keychain." >&2
  exit 1
fi

colima ssh -- sudo mkdir -p /usr/local/share/ca-certificates
colima ssh -- sudo tee /usr/local/share/ca-certificates/zscaler-root-ca.crt > /dev/null < "${CERT_TMP}"
colima ssh -- sudo update-ca-certificates
colima ssh -- sudo systemctl restart docker 2>/dev/null || colima ssh -- sudo service docker restart 2>/dev/null || true
sleep 2

echo "Verifying registry access from Colima VM..."
if colima ssh -- curl -sSI https://registry-1.docker.io/v2/ 2>&1 | grep -qE "HTTP/[0-9.]+ (200|401)"; then
  echo "SUCCESS — Colima can reach Docker Hub. Retry: bash scripts/e2e.sh"
else
  echo "WARNING — registry still unreachable from Colima. Check VPN/proxy or use Docker Desktop." >&2
  exit 1
fi
