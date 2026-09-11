#!/usr/bin/env bash
# ===========================================================================
# backup.sh — dump the database and mirror uploaded media to deploy/backups/.
#
#   ./deploy/scripts/backup.sh
#
# Cron example (daily 02:15, keep logs):
#   15 2 * * *  /home/ubuntu/alert-eye/deploy/scripts/backup.sh >> /home/ubuntu/backup.log 2>&1
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
BACKUP_RETENTION_DAYS="$(env_get BACKUP_RETENTION_DAYS)"

DC="docker compose"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="$DEPLOY_DIR/backups"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$OUT"

echo "==> [$STAMP] database dump"
$DC exec -T db pg_dump \
  -U "${POSTGRES_USER:-alerteye}" -d "${POSTGRES_DB:-alerteye}" \
  --clean --if-exists --no-owner --no-privileges \
  | gzip -9 > "$OUT/db-$STAMP.sql.gz"
echo "    $OUT/db-$STAMP.sql.gz  ($(du -h "$OUT/db-$STAMP.sql.gz" | cut -f1))"

echo "==> [$STAMP] media mirror"
NET="$($DC ps -q db | head -1 | xargs -r docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
[[ -n "$NET" ]] || { echo "could not determine compose network" >&2; exit 1; }
docker run --rm --network "$NET" \
  -e "MC_HOST_s3=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
  -v "$OUT/media-latest:/backup" \
  minio/mc:latest mirror --overwrite --remove "s3/${S3_BUCKET:-alerteye-media}" /backup
tar czf "$OUT/media-$STAMP.tgz" -C "$OUT/media-latest" .
echo "    $OUT/media-$STAMP.tgz  ($(du -h "$OUT/media-$STAMP.tgz" | cut -f1))"

echo "==> pruning backups older than ${RETENTION} days"
find "$OUT" -maxdepth 1 -name 'db-*.sql.gz' -mtime "+${RETENTION}" -print -delete || true
find "$OUT" -maxdepth 1 -name 'media-*.tgz'  -mtime "+${RETENTION}" -print -delete || true

echo "==> done"
