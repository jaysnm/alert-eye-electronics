#!/usr/bin/env bash
# ===========================================================================
# restore.sh — restore a database dump and/or a media archive.
#
#   ./deploy/scripts/restore.sh --db   deploy/backups/db-20260907-021500.sql.gz
#   ./deploy/scripts/restore.sh --media deploy/backups/media-20260907-021500.tgz
#
# DESTRUCTIVE: the target database rows / media objects are replaced.
# The stack should be running (db + minio up). Stop the app first if possible:
#   cd deploy && docker compose stop app
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$DEPLOY_DIR"

[[ -f .env ]] || { echo "deploy/.env not found" >&2; exit 1; }
env_get() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//'; }
POSTGRES_USER="$(env_get POSTGRES_USER)";       POSTGRES_USER="${POSTGRES_USER:-alerteye}"
POSTGRES_DB="$(env_get POSTGRES_DB)";           POSTGRES_DB="${POSTGRES_DB:-alerteye}"
MINIO_ROOT_USER="$(env_get MINIO_ROOT_USER)"
MINIO_ROOT_PASSWORD="$(env_get MINIO_ROOT_PASSWORD)"
S3_BUCKET="$(env_get S3_BUCKET)";               S3_BUCKET="${S3_BUCKET:-alerteye-media}"
DC="docker compose"

DB_FILE=""
MEDIA_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db)    DB_FILE="$2"; shift 2 ;;
    --media) MEDIA_FILE="$2"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done
[[ -z "$DB_FILE" && -z "$MEDIA_FILE" ]] && { echo "nothing to do: pass --db and/or --media" >&2; exit 2; }

confirm() {
  read -r -p "$1 [type 'yes']: " ans
  [[ "$ans" == "yes" ]] || { echo "aborted."; exit 1; }
}

if [[ -n "$DB_FILE" ]]; then
  [[ -f "$DB_FILE" ]] || { echo "no such file: $DB_FILE" >&2; exit 1; }
  confirm "Restore database from $(basename "$DB_FILE") — this REPLACES current data"
  echo "==> restoring database"
  gunzip -c "$DB_FILE" | $DC exec -T db psql -U "${POSTGRES_USER:-alerteye}" -d "${POSTGRES_DB:-alerteye}" -v ON_ERROR_STOP=1
  echo "    database restored"
fi

if [[ -n "$MEDIA_FILE" ]]; then
  [[ -f "$MEDIA_FILE" ]] || { echo "no such file: $MEDIA_FILE" >&2; exit 1; }
  confirm "Restore media from $(basename "$MEDIA_FILE") — this OVERWRITES the bucket"
  echo "==> restoring media"
  TMP="$(mktemp -d)"
  tar xzf "$MEDIA_FILE" -C "$TMP"
  NET="$($DC ps -q minio | head -1 | xargs -r docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
  docker run --rm --network "$NET" \
    -e "MC_HOST_s3=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
    -v "$TMP:/restore:ro" \
    minio/mc:latest mirror --overwrite "/restore" "s3/${S3_BUCKET:-alerteye-media}"
  rm -rf "$TMP"
  echo "    media restored"
fi

echo "==> start the app again:  cd deploy && docker compose up -d app"
