#!/usr/bin/env bash
#
# Start the Next.js dev server (storefront + Payload admin/API) on a free port.
#
# - If our own port is held by a stale dev server from this repo, reclaim it
#   (fixes Next's "Another next dev server is already running").
# - If the port is held by an unrelated process, hop to the next one.
# - Exports NEXT_PUBLIC_SERVER_URL so absolute URLs (payment callbacks, media)
#   match the port actually used.

set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
port="${PORT:-3000}"
max=$((port + 20))

port_holder() { lsof -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -1; }
proc_cwd() { lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1; }

chosen=""
p="$port"
while [ "$p" -le "$max" ]; do
  holder="$(port_holder "$p")"
  if [ -z "$holder" ]; then
    chosen="$p"
    break
  fi
  if [ "$(proc_cwd "$holder")" = "$repo_root" ]; then
    echo "Reclaiming port $p from a stale dev server (pid $holder)…"
    kill "$holder" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      [ -z "$(port_holder "$p")" ] && break
      sleep 1
    done
    [ -z "$(port_holder "$p")" ] && { chosen="$p"; break; }
    kill -9 "$holder" 2>/dev/null || true
    sleep 1
    chosen="$p"
    break
  fi
  echo "Port $p is in use by another process — trying $((p + 1))…"
  p=$((p + 1))
done

if [ -z "$chosen" ]; then
  echo "No free port found between $port and $max." >&2
  exit 1
fi

export NEXT_PUBLIC_SERVER_URL="http://localhost:$chosen"
echo "Starting Alert Eye on $NEXT_PUBLIC_SERVER_URL  (admin: /admin)"
exec pnpm exec next dev -p "$chosen"
