#!/usr/bin/env bash
# Deploy Genesis Startup Studio to a GCE VM via gcloud.
#
# Usage:
#   scripts/deploy-gcp.sh                  # uses defaults below
#   PORT=8027 INSTANCE=human-1 scripts/deploy-gcp.sh
#
# Requires: gcloud, ssh access to the target VM, Docker installed on the VM.

set -euo pipefail

PROJECT="${PROJECT:-i-crossbar-433120-v3}"
ZONE="${ZONE:-europe-west1-b}"
INSTANCE="${INSTANCE:-human-1}"
PORT="${PORT:-8026}"
REMOTE_DIR="${REMOTE_DIR:-/opt/genesis}"

cd "$(dirname "$0")/.."

STAMP="$(date +%Y%m%d-%H%M%S)"
TARBALL="/tmp/genesis-${STAMP}.tar.gz"
TARBASE="$(basename "$TARBALL")"

echo "→ packing source → ${TARBALL}"
tar czf "${TARBALL}" \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./web/node_modules' \
  --exclude='./web/dist' \
  --exclude='./web/.vite' \
  --exclude='./web/coverage' \
  --exclude='**/.DS_Store' \
  ./web ./docker-compose.yml ./README.md ./SPEC_v0.1.md ./CLAUDE.md ./scripts

echo "→ preparing remote dir on ${INSTANCE}"
gcloud compute ssh "${INSTANCE}" \
  --project "${PROJECT}" --zone "${ZONE}" \
  --command "sudo mkdir -p ${REMOTE_DIR} && sudo chown -R \$USER ${REMOTE_DIR} && sudo rm -rf ${REMOTE_DIR}/* ${REMOTE_DIR}/.[!.]* 2>/dev/null || true"

echo "→ uploading tarball"
gcloud compute scp "${TARBALL}" "${INSTANCE}:/tmp/${TARBASE}" \
  --project "${PROJECT}" --zone "${ZONE}"

echo "→ unpacking and (re)building container on port ${PORT}"
gcloud compute ssh "${INSTANCE}" \
  --project "${PROJECT}" --zone "${ZONE}" \
  --command "set -euo pipefail
cd ${REMOTE_DIR}
tar xzf /tmp/${TARBASE}
rm -f /tmp/${TARBASE}

if ! command -v docker >/dev/null 2>&1; then
  echo '!! docker is not installed on this VM. Install it first, then re-run.' >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC='docker compose'
elif command -v docker-compose >/dev/null 2>&1; then
  DC='docker-compose'
else
  echo '!! neither docker compose plugin nor docker-compose found.' >&2
  exit 1
fi

GENESIS_PORT=${PORT} \$DC down --remove-orphans || true
GENESIS_PORT=${PORT} \$DC up -d --build
GENESIS_PORT=${PORT} \$DC ps
"

rm -f "${TARBALL}"

cat <<EOF

✓ Deployed.

  open from another machine:  http://<external-ip-of-${INSTANCE}>:${PORT}
  open from the VM itself:    curl -I http://127.0.0.1:${PORT}

Make sure the GCP firewall allows TCP:${PORT}:
  gcloud compute firewall-rules create allow-genesis-${PORT} \\
    --project=${PROJECT} \\
    --direction=INGRESS --action=ALLOW --rules=tcp:${PORT} \\
    --source-ranges=0.0.0.0/0

Find external IP:
  gcloud compute instances describe ${INSTANCE} \\
    --project=${PROJECT} --zone=${ZONE} \\
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
EOF
