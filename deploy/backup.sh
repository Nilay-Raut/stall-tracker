#!/usr/bin/env bash
# Dumps the database and uploads it, encrypted, to the private S3 backup bucket.
# Runs nightly from a systemd timer, and before every deploy.
#   bash /opt/stall/backup.sh [label]     label defaults to "nightly"
set -euo pipefail
cd /opt/stall
# shellcheck disable=SC1091
source .env

LABEL="${1:-nightly}"
STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
FILE="/tmp/stall-${STAMP}-${LABEL}.sql.gz"
trap 'rm -f "$FILE"' EXIT

docker compose exec -T db pg_dump -U stall -d stall --no-owner --clean --if-exists | gzip -9 > "$FILE"

# A dump of an empty-but-valid database is still a few hundred bytes.
if [[ $(stat -c %s "$FILE") -lt 200 ]]; then
  echo "Backup looks empty, not uploading." >&2
  exit 1
fi

aws s3 cp "$FILE" "s3://${BACKUP_BUCKET}/backups/$(basename "$FILE")" \
  --sse AES256 --only-show-errors --region "$AWS_REGION"
echo "Backup uploaded: backups/$(basename "$FILE")"
