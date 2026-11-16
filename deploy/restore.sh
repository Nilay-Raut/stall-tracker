#!/usr/bin/env bash
# Restores the database from a backup in S3. This REPLACES all current data.
#   bash /opt/stall/restore.sh                      lists available backups
#   bash /opt/stall/restore.sh <backup-file-name>   restores that backup
set -euo pipefail
cd /opt/stall
# shellcheck disable=SC1091
source .env

if [[ $# -eq 0 ]]; then
  aws s3 ls "s3://${BACKUP_BUCKET}/backups/" --region "$AWS_REGION" | sort | tail -20
  echo "Pass one of the file names above to restore it."
  exit 0
fi

NAME="$1"
FILE="/tmp/${NAME}"
trap 'rm -f "$FILE"' EXIT

read -r -p "This replaces ALL current data with ${NAME}. Type RESTORE to continue: " answer
[[ "$answer" == "RESTORE" ]] || { echo "Cancelled."; exit 1; }

echo "Taking a safety backup of the current data first"
bash /opt/stall/backup.sh pre-restore

aws s3 cp "s3://${BACKUP_BUCKET}/backups/${NAME}" "$FILE" --only-show-errors --region "$AWS_REGION"

docker compose stop app
gunzip -c "$FILE" | docker compose exec -T db psql -U stall -d stall --single-transaction -v ON_ERROR_STOP=1 > /dev/null
docker compose start app
echo "Restored ${NAME}."
