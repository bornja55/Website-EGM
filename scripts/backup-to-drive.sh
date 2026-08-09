#!/usr/bin/env bash
# Nightly PocketBase backup -> Google Drive. Runs on the VM via crontab, NOT
# in CI/CD (backups should happen whether or not anyone deploys that day).
#
# Uses PocketBase's own /api/backups endpoint (creates a consistent zip
# snapshot server-side) instead of copying pb_data files directly — copying
# a live SQLite DB's files while PocketBase is running (WAL mode) risks a
# torn/inconsistent copy. The backup API sidesteps that entirely.
#
# Setup (one-time, on the VM):
#   1. Install rclone: curl https://rclone.org/install.sh | sudo bash
#   2. Configure a Google Drive remote: rclone config
#      (name it exactly "gdrive" to match the default below, or edit RCLONE_REMOTE)
#   3. Create the crontab entry:
#      crontab -e
#      0 3 * * * /opt/englishmania/scripts/backup-to-drive.sh >> /var/log/englishmania-backup.log 2>&1
#
# Env vars this script needs (source them from the same .env the deploy
# workflow writes, or hardcode locally — see README):
#   PB_URL              default http://127.0.0.1:8090
#   SUPERUSER_EMAIL / SUPERUSER_PASS
#   RCLONE_REMOTE       default "gdrive:englishmania-backups"
#   RETENTION_DAYS      default 14

set -euo pipefail

PB_URL="${PB_URL:-http://127.0.0.1:8090}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:englishmania-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DATE_TAG="$(date +%F_%H%M)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [[ -z "${SUPERUSER_EMAIL:-}" || -z "${SUPERUSER_PASS:-}" ]]; then
  echo "SUPERUSER_EMAIL / SUPERUSER_PASS not set — source the .env file first." >&2
  exit 1
fi

echo "[$DATE_TAG] Authenticating as superuser..."
TOKEN=$(curl -sf -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$SUPERUSER_EMAIL\",\"password\":\"$SUPERUSER_PASS\"}" \
  | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")

if [[ -z "$TOKEN" ]]; then
  echo "Auth failed — aborting backup." >&2
  exit 1
fi

BACKUP_NAME="englishmania_${DATE_TAG}.zip"
echo "[$DATE_TAG] Requesting backup: $BACKUP_NAME"
curl -sf -X POST "$PB_URL/api/backups" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$BACKUP_NAME\"}"

# PocketBase creates the backup asynchronously — poll until it shows up.
echo "[$DATE_TAG] Waiting for backup to finish..."
for i in $(seq 1 30); do
  FOUND=$(curl -sf "$PB_URL/api/backups" -H "Authorization: $TOKEN" \
    | node -e "process.stdin.on('data', d => { const list = JSON.parse(d); console.log(list.some(b => b.key === '$BACKUP_NAME') ? 'yes' : 'no'); })")
  [[ "$FOUND" == "yes" ]] && break
  sleep 2
done

echo "[$DATE_TAG] Downloading backup..."
curl -sf "$PB_URL/api/backups/$BACKUP_NAME" -H "Authorization: $TOKEN" -o "$TMP_DIR/$BACKUP_NAME"

echo "[$DATE_TAG] Uploading to $RCLONE_REMOTE ..."
rclone copy "$TMP_DIR/$BACKUP_NAME" "$RCLONE_REMOTE/"

echo "[$DATE_TAG] Deleting the copy PocketBase kept on the VM (Drive is the source of truth now)..."
curl -sf -X DELETE "$PB_URL/api/backups/$BACKUP_NAME" -H "Authorization: $TOKEN"

echo "[$DATE_TAG] Pruning backups on Drive older than ${RETENTION_DAYS}d..."
rclone delete --min-age "${RETENTION_DAYS}d" "$RCLONE_REMOTE/"

echo "[$DATE_TAG] Done."
