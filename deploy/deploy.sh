#!/usr/bin/env bash
# Deploys one app image on the server. Run as root by GitHub Actions through
# AWS Systems Manager:  bash /opt/stall/deploy.sh <ecr-image-uri:tag>
#
# Steps: back up the database -> pull the image -> run migrations ->
# swap the app container -> wait for health -> roll back the app if unhealthy.
set -euo pipefail

IMAGE="${1:?usage: deploy.sh <image-uri:tag>}"
cd /opt/stall

# shellcheck disable=SC1091
source .env
REGISTRY="${IMAGE%%/*}"
PREVIOUS_IMAGE="${APP_IMAGE:-}"
# Compose reads APP_IMAGE from the environment first. Until the swap, keep the
# running version (or the new one on the very first deploy).
export APP_IMAGE="${PREVIOUS_IMAGE:-$IMAGE}"

log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

set_image() {
  if grep -q '^APP_IMAGE=' .env; then
    sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$1|" .env
  else
    echo "APP_IMAGE=$1" >> .env
  fi
  export APP_IMAGE="$1"
}

log "Logging in to the image registry"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"

log "Pulling $IMAGE"
docker pull --quiet "$IMAGE"

log "Starting the database"
docker compose up -d --wait db

# Rule: always back up before changing the schema.
if [[ -n "$PREVIOUS_IMAGE" ]]; then
  log "Backing up the database before migrating"
  bash /opt/stall/backup.sh pre-deploy
fi

# Secrets made on the server the first time they are needed (they never leave it).
missing=()
for key in CRON_SECRET VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY PAYMENTS_KEY; do
  grep -q "^${key}=." .env || missing+=("$key")
done
if (( ${#missing[@]} )); then
  log "Creating server secrets: ${missing[*]}"
  sed -i "/^\(CRON_SECRET\|VAPID_PUBLIC_KEY\|VAPID_PRIVATE_KEY\|PAYMENTS_KEY\)=$/d" .env
  docker run --rm "$IMAGE" node tools/scripts/generate-secrets.mjs "${missing[@]}" >> .env
fi

log "Running migrations"
docker run --rm --network stall_default \
  -e DATABASE_URL="postgres://stall:${POSTGRES_PASSWORD}@db:5432/stall" \
  "$IMAGE" node tools/scripts/migrate.mjs

log "Starting the new app version"
set_image "$IMAGE"
docker compose up -d --wait --wait-timeout 90 app caddy || {
  log "New version is not healthy"
  docker compose logs --tail 50 app || true
  if [[ -n "$PREVIOUS_IMAGE" ]]; then
    log "Rolling back to $PREVIOUS_IMAGE (migrations stay applied; they must be backward compatible)"
    set_image "$PREVIOUS_IMAGE"
    docker compose up -d --wait app
  fi
  exit 1
}

log "Installing the backup and reminder timers"
install -m 644 stall-backup.service stall-backup.timer \
  stall-reminders.service stall-reminders.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now stall-backup.timer stall-reminders.timer > /dev/null

log "Removing old images"
docker image prune -af --filter "until=168h" > /dev/null || true

log "Deployed $IMAGE"
