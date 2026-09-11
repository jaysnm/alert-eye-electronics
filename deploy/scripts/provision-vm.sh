#!/usr/bin/env bash
# ===========================================================================
# provision-vm.sh — one-time setup for a fresh Oracle Cloud "Always Free" VM
# (Ubuntu 22.04 / 24.04, Ampere ARM64 or x86).
#
# Installs Docker + Compose, opens the host firewall for HTTP/HTTPS, adds
# swap on small shapes, and clones the repo. Run it once as the default
# 'ubuntu' user:
#
#   curl -fsSLO https://raw.githubusercontent.com/<you>/<repo>/main/deploy/scripts/provision-vm.sh
#   bash provision-vm.sh https://github.com/<you>/<repo>.git
#
# Then: cd ~/alert-eye/deploy, cp .env.deploy.example .env, edit, and run
#   ./scripts/deploy.sh
# ===========================================================================
set -euo pipefail

REPO_URL="${1:-}"
CLONE_DIR="${2:-$HOME/alert-eye}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] && die "Run as the normal 'ubuntu' user, not root (the script uses sudo where needed)."
command -v sudo >/dev/null || die "sudo is required."

# ---------------------------------------------------------------------------
log "System packages"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl git jq iptables-persistent

# ---------------------------------------------------------------------------
log "Docker Engine + Compose plugin"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker
docker compose version >/dev/null || die "Docker Compose plugin missing."

# ---------------------------------------------------------------------------
log "Host firewall — allow 80/443 (Oracle Ubuntu images block these by default)"
# Oracle's Ubuntu images ship an iptables INPUT chain that REJECTs everything
# except SSH. Insert ACCEPT rules for HTTP/HTTPS ahead of the reject rule.
add_rule() {
  local proto=$1 port=$2
  if ! sudo iptables -C INPUT -p "$proto" --dport "$port" -j ACCEPT 2>/dev/null; then
    # Insert before the first REJECT rule if present, else append.
    local rej
    rej=$(sudo iptables -L INPUT --line-numbers | awk '/REJECT/ {print $1; exit}')
    if [[ -n "${rej:-}" ]]; then
      sudo iptables -I INPUT "$rej" -p "$proto" --dport "$port" -j ACCEPT
    else
      sudo iptables -A INPUT -p "$proto" --dport "$port" -j ACCEPT
    fi
  fi
}
add_rule tcp 80
add_rule tcp 443
add_rule udp 443            # HTTP/3 (QUIC)
sudo netfilter-persistent save
# If ufw is active on your image, also: sudo ufw allow 80,443/tcp

cat <<'NOTE'

  ┌─────────────────────────────────────────────────────────────────────┐
  │  ALSO open the ports in the Oracle Cloud console (cloud firewall):   │
  │  Networking → VCN → your subnet → Security List → Add Ingress Rules  │
  │    Source 0.0.0.0/0  IP Protocol TCP  Dest port 80                   │
  │    Source 0.0.0.0/0  IP Protocol TCP  Dest port 443                  │
  │    Source 0.0.0.0/0  IP Protocol UDP  Dest port 443   (HTTP/3)       │
  └─────────────────────────────────────────────────────────────────────┘

NOTE

# ---------------------------------------------------------------------------
log "Swap (added only on shapes with < 4 GB RAM)"
mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [[ "$mem_mb" -lt 4096 && ! -f /swapfile ]]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  echo "  added 2 GB swap"
else
  echo "  skipped (RAM=${mem_mb}MB)"
fi

# ---------------------------------------------------------------------------
log "Repository"
if [[ -n "$REPO_URL" ]]; then
  if [[ -d "$CLONE_DIR/.git" ]]; then
    git -C "$CLONE_DIR" pull --ff-only
  else
    git clone "$REPO_URL" "$CLONE_DIR"
  fi
  echo "  repo at $CLONE_DIR"
else
  echo "  no REPO_URL given — clone or upload the project yourself."
fi

cat <<NOTE

Provisioning done.

  1. Log out and back in (so 'docker' works without sudo):   exit; ssh ...
  2. cd ${CLONE_DIR}/deploy
  3. cp .env.deploy.example .env  &&  edit .env
  4. ./scripts/deploy.sh

NOTE
