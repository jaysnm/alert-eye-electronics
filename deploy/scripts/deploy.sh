#!/usr/bin/env bash
# ===========================================================================
# deploy.sh — build, migrate, and (re)start the Alert Eye stack.
#
# Safe to run repeatedly. Run from anywhere:
#
#   ./deploy/scripts/deploy.sh              # pull, build, migrate, restart
#   ./deploy/scripts/deploy.sh --no-pull    # skip 'git pull'
#   ./deploy/scripts/deploy.sh --seed       # also load demo catalogue + admin
#
# Requires deploy/.env (see .env.deploy.example).
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
cd "$DEPLOY_DIR"

DO_PULL=1
DO_SEED=0
for arg in "$@"; do
  case "$arg" in
    --no-pull) DO_PULL=0 ;;
    --seed)    DO_SEED=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

# health_of <service> -> prints "healthy" | "starting" | "unhealthy" | "none"
health_of() {
  local cid
  cid="$(docker compose ps -q "$1" 2>/dev/null | head -1)"
  [[ -n "$cid" ]] || { echo "none"; return; }
  docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo "none"
}

wait_healthy() {
  local svc="$1" tries="${2:-40}" i
  for ((i = 1; i <= tries; i++)); do
    [[ "$(health_of "$svc")" == "healthy" ]] && return 0
    sleep 3
  done
  return 1
}

# Read one key from deploy/.env without sourcing it (values may contain spaces,
# '<', '>' etc. — e.g. EMAIL_FROM — which a shell `source` would choke on).
env_get() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//'; }

[[ -f .env ]] || die "deploy/.env not found. Copy .env.deploy.example to .env and fill it in."
DOMAIN="$(env_get DOMAIN)"
PAYLOAD_SECRET="$(env_get PAYLOAD_SECRET)"
[[ -n "$DOMAIN" ]]                      || die "DOMAIN is not set in deploy/.env"
[[ -n "$PAYLOAD_SECRET" ]]              || die "PAYLOAD_SECRET is not set in deploy/.env"
[[ "$PAYLOAD_SECRET" == *CHANGE_ME* ]] && die "PAYLOAD_SECRET still has its placeholder value"

DC="docker compose"

# ---------------------------------------------------------------------------
if [[ $DO_PULL -eq 1 && -d "$REPO_DIR/.git" ]]; then
  log "Pulling latest code"
  git -C "$REPO_DIR" pull --ff-only
fi

log "Building app image"
$DC build app

log "Starting database + object storage"
$DC up -d db minio

log "Waiting for database to be healthy"
wait_healthy db 30 || die "database did not become healthy — docker compose logs db"

log "Preparing the media bucket"
$DC run --rm -T minio-init || die "could not initialise the MinIO bucket"

# Stop the old app so the deploy-time `next build` can replace the shared
# .next volume cleanly (brief downtime — a few minutes — during each deploy).
$DC stop app >/dev/null 2>&1 || true

log "Running database migrations"
timeout 600 $DC run --rm -T app pnpm payload migrate \
  || die "migration step failed or timed out (see: docker compose logs db)"

if [[ $DO_SEED -eq 1 ]]; then
  log "Seeding demo catalogue + admin user"
  $DC run --rm -T -e PAYLOAD_SEED=true app pnpm seed
fi

log "Compiling the app (next build)"
timeout 1800 $DC run --rm -T app pnpm exec next build \
  || die "build failed or timed out"

log "Starting / reloading all services"
$DC up -d

log "Waiting for the app to report healthy"
wait_healthy app 40 || { $DC logs --tail 60 app; die "app did not become healthy"; }

log "Pruning dangling images"
docker image prune -f >/dev/null || true

cat <<DONE

Deploy complete.

  Storefront : https://${DOMAIN}
  Admin      : https://${DOMAIN}/admin

  First deploy: open /admin and create the first admin user
  (or re-run with --seed to load demo data + admin@alerteye.co.ke / ChangeMe123!).

  Caddy will obtain the TLS certificate on first HTTPS request — allow ~30s and
  make sure ${DOMAIN} already resolves to this VM and ports 80/443 are open
  (Oracle console Security List + host firewall).

  Logs:    cd deploy && docker compose logs -f app
  Status:  cd deploy && docker compose ps

DONE
