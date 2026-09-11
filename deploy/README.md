# Deploying Alert Eye Electronics on an Oracle Cloud "Always Free" VM

A single VM runs the whole stack with Docker Compose:

| Container | Role | Exposed |
|-----------|------|---------|
| `caddy`   | TLS termination + reverse proxy, automatic Let's Encrypt certs | 80, 443 (public) |
| `app`     | Next.js storefront **and** Payload admin/API (one process)     | internal only |
| `db`      | PostgreSQL 18                                                  | 127.0.0.1:5432 |
| `minio`   | S3-compatible object storage for uploaded media                | 127.0.0.1:9001 (console) |

Uploaded media lives in MinIO (not the container filesystem), so redeploys and
restarts never lose images. The database lives in a Docker volume on the VM's
block storage.

**Cost:** OCI Always Free (1 Ampere A1 VM — up to 4 OCPU / 24 GB RAM / 200 GB) +
a domain name (~USD 10/year). Everything else here is free and self-hosted.

---

## 1. Create the VM

Oracle Cloud console → **Compute → Instances → Create instance**:

- **Image:** Canonical Ubuntu 24.04 (or 22.04)
- **Shape:** `VM.Standard.A1.Flex` (Ampere/ARM). 2 OCPU / 12 GB is plenty; 4/24 if available.
  - If A1 capacity is unavailable in your region, `VM.Standard.E2.1.Micro` (x86, 1 GB) also works — the provisioning script adds swap automatically, but builds will be slow.
- **SSH keys:** upload your public key.
- Create, and note the **public IPv4 address**.

### Open the firewall (two layers)

**Cloud firewall** — console → **Networking → Virtual Cloud Networks → (your VCN)
→ (your subnet) → Security Lists → Default Security List → Add Ingress Rules:**

| Source CIDR | IP Protocol | Destination Port |
|-------------|-------------|------------------|
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |
| `0.0.0.0/0` | UDP | 443 |

**Host firewall** — handled by `provision-vm.sh` below (Oracle's Ubuntu images
block everything except SSH with local iptables rules).

---

## 2. Point your domain at the VM

At your DNS provider, create records for the public IP:

```
A     alerteye.co.ke        <VM_PUBLIC_IP>
A     www.alerteye.co.ke    <VM_PUBLIC_IP>     (optional)
```

Wait for it to resolve (`dig +short alerteye.co.ke`) before deploying — Caddy
needs it to issue the certificate.

---

## 3. Provision the VM (once)

SSH in as `ubuntu` and run:

```bash
curl -fsSLO https://raw.githubusercontent.com/<you>/<repo>/main/deploy/scripts/provision-vm.sh
bash provision-vm.sh https://github.com/<you>/<repo>.git
```

This installs Docker + Compose, opens ports 80/443 on the host, adds swap on
small shapes, and clones the repo to `~/alert-eye`.

**Log out and back in** afterwards so `docker` works without `sudo`.

> Private repo? Skip the URL argument, then upload the project yourself
> (`scp -r`, `rsync`, or a deploy key) to `~/alert-eye`.

---

## 4. Configure secrets

```bash
cd ~/alert-eye/deploy
cp .env.deploy.example .env
nano .env
```

Fill in at minimum:

| Variable | Notes |
|----------|-------|
| `DOMAIN`, `NEXT_PUBLIC_SERVER_URL` | your real domain |
| `ACME_EMAIL` | for Let's Encrypt expiry notices |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
| `PAYLOAD_SECRET` | `openssl rand -hex 32` |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `openssl rand -hex 24` for the password |

Everything else (Resend, Paystack, M-Pesa) is optional and can be added later —
re-run `./scripts/deploy.sh` after editing `.env` to apply changes.

> `NEXT_PUBLIC_*` values are compiled into the frontend at build time, so
> changing any of them requires a redeploy (the deploy script rebuilds).

---

## 5. Deploy

```bash
cd ~/alert-eye/deploy
./scripts/deploy.sh --seed      # first run: also loads demo catalogue + admin
```

The script builds the image, starts Postgres + MinIO, runs migrations,
compiles the app, and brings everything up behind Caddy.

- Storefront: `https://<DOMAIN>`
- Admin: `https://<DOMAIN>/admin`

**First HTTPS request** triggers certificate issuance — give it ~30 seconds.
If it fails, check `docker compose logs caddy` (usual causes: DNS not resolving
yet, or port 80 blocked in the Oracle Security List).

### First admin user

- With `--seed`: log in as `admin@alerteye.co.ke` / `ChangeMe123!` **and change
  the password immediately** (Admin → Users).
- Without `--seed`: open `/admin` and Payload prompts you to create the first user.

Then fill in **Site Settings** and **Homepage** in the admin.

---

## 6. Day-2 operations

All commands from `~/alert-eye/deploy`.

```bash
# Deploy the latest code (pull + rebuild + migrate + restart).
# The app is briefly down (a few minutes) while it recompiles.
./scripts/deploy.sh

# Redeploy without pulling (e.g. after editing .env)
./scripts/deploy.sh --no-pull

# Logs / status
docker compose logs -f app
docker compose ps

# psql shell
docker compose exec db psql -U alerteye -d alerteye

# Restart just the app
docker compose restart app

# Stop / start the whole stack
docker compose stop
docker compose up -d
```

### Backups

```bash
./scripts/backup.sh          # writes deploy/backups/db-*.sql.gz + media-*.tgz
```

Automate with cron (`crontab -e`):

```
15 2 * * *  /home/ubuntu/alert-eye/deploy/scripts/backup.sh >> /home/ubuntu/backup.log 2>&1
```

For off-site copies, sync `deploy/backups/` to a free remote with `rclone`
(e.g. Backblaze B2's 10 GB free tier).

### Restore

```bash
docker compose stop app
./scripts/restore.sh --db    deploy/backups/db-20260907-021500.sql.gz
./scripts/restore.sh --media deploy/backups/media-20260907-021500.tgz
docker compose up -d app
```

---

## 7. Payment webhooks

Once live, register these URLs with the providers:

- **Paystack** dashboard → Settings → API Keys & Webhooks →
  `https://<DOMAIN>/api/webhooks/paystack`
- **Safaricom Daraja** → your app → register
  `https://<DOMAIN>/api/webhooks/mpesa` (Safaricom whitelists callback URLs;
  a real domain is required, `*.nip.io` style hosts are rejected). Set
  `MPESA_ALLOWED_IPS` in `.env` to Safaricom's published callback IPs.

---

## 8. Optional — serve media from its own subdomain

By default media is streamed through the app (`/api/media/...`), which is fine
at small scale. To offload it to MinIO directly:

1. Add DNS: `A  media.alerteye.co.ke  <VM_PUBLIC_IP>`
2. In `deploy/Caddyfile` add a second site block:
   ```
   media.{$DOMAIN} {
       reverse_proxy minio:9000
   }
   ```
3. Set `NEXT_PUBLIC_S3_PUBLIC_URL=https://media.alerteye.co.ke` in `.env`
4. Set the Media collection to return direct URLs — in `src/payload.config.ts`,
   pass `disablePayloadAccessControl: true` in the `s3Storage` `collections.media`
   config. (Media is already publicly readable.)
5. `./scripts/deploy.sh --no-pull`

---

## 9. Troubleshooting

| Symptom | Check |
|---------|-------|
| Cert never issues | `docker compose logs caddy`; confirm `dig +short <DOMAIN>` = VM IP; port 80 open in **both** firewalls |
| 502 from Caddy | `docker compose logs app`; app may still be building or unhealthy — `docker compose ps` |
| `migration step failed` | `docker compose logs db`; ensure `db` is healthy; a half-applied dev database needs a clean volume |
| Build OOM on micro shape | provisioning script adds 2 GB swap; consider an A1 shape instead |
| Images 404 after upload | `docker compose logs minio minio-init`; confirm the bucket exists and `S3_*` vars match `MINIO_ROOT_*` |

---

## What's committed vs. generated

- **Committed:** `deploy/` (this dir), `src/migrations/` (schema migrations), `.dockerignore`.
- **Generated / ignored:** `deploy/.env`, `deploy/backups/`, the Docker volumes.
- **On schema change:** run `pnpm payload migrate:create <name>` locally, commit
  the new files in `src/migrations/`, then `./scripts/deploy.sh` on the VM.
