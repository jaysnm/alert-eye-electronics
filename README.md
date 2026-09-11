# Alert Eye Electronics

E‑commerce storefront **and** sales/service back‑office for a Kenyan electronics &
security business (CCTV, networking, access control) — built as one Next.js app
with an embedded Payload CMS admin panel.

- **Storefront:** catalogue, search/filter, cart, checkout (Paystack + M‑Pesa STK +
  manual methods), guest & customer accounts, order tracking.
- **Services:** service catalogue + a full request workflow —
  `new → quoted → scheduled → in progress → completed` with technician assignment,
  quotes, deposits and a customer‑facing status timeline.
- **Admin:** `/admin` — products, orders, service requests, customers, content, with
  role‑based access (admin / manager / sales / technician).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Admin / API | Payload CMS 3 (`/admin`, REST + GraphQL) |
| Database | PostgreSQL (`@payloadcms/db-postgres`) |
| Media | Local disk in dev; S3‑compatible (Cloudflare R2) in prod via `@payloadcms/storage-s3` |
| Styling | Tailwind CSS v4 |
| Payments | Paystack, Safaricom Daraja (M‑Pesa STK), manual (Paybill / bank / COD) |
| Email | Resend (`@payloadcms/email-resend`) — falls back to console when unset |

## Project layout

```
src/
  payload.config.ts        Payload config (collections, globals, plugins)
  collections/             Products, Categories, Brands, Media, Orders,
                           Customers, ServiceTypes, ServiceRequests, Pages, Users
  globals/                 SiteSettings, Homepage
  access/                  Role-based access-control helpers
  actions/                 Server actions: checkout, service-request, auth, quote
  lib/
    payments/              PaymentProvider abstraction + paystack / mpesa / manual
    orders.ts              markOrderPaid() — idempotent payment + stock decrement
    queries.ts             Cached storefront data fetchers
    cart.ts                Client cart store (zustand + localStorage)
  app/(frontend)/          Storefront routes
  app/(payload)/           Admin panel + Payload API routes
  app/api/webhooks/        /paystack and /mpesa payment callbacks
  app/api/upload/          Public image upload for the service-request form
  seed/                    run.ts (demo data), smoke.ts (order-flow check)
```

---

## Local development

Prerequisites: Node ≥ 20, pnpm, Docker (for the local Postgres).

```bash
cp .env.example .env          # then edit values
make dev                      # installs deps, starts Postgres, runs the app
```

`make dev` brings up the whole local stack — Docker Postgres + the Next.js dev
server (storefront **and** Payload admin/API) on http://localhost:3000 (`/admin`).

Run `make help` for all targets. Common ones:

| Target | Does |
|---|---|
| `make dev` | DB + frontend/backend dev server (auto-picks a free port; reclaims a stale one from this repo). Override with `make dev PORT=4000` |
| `make stop` | Stop any dev server started from this repo |
| `make build` / `make start` | Production build / serve |
| `make check` | `typecheck` + `lint` |
| `make test` | End-to-end order/payment/stock smoke test |
| `make seed` | Load demo data |
| `make migrate` / `make migrate-create` | Payload migrations |
| `make db-up` / `make db-down` / `make db-reset` | Local Postgres container |
| `make db-shell` | `psql` into the local DB |
| `make types` / `make importmap` | Regenerate Payload types / admin import map |
| `make nuke` | Remove `node_modules`, caches and the DB container |

Prefer `pnpm` directly if you don't have Docker (point `DATABASE_URI` at any Postgres).

A dedicated Postgres for local dev (matches `.env.example`):

```bash
docker run -d --name alert-eye-db \
  -e POSTGRES_DB=alerteye -e POSTGRES_USER=alerteye -e POSTGRES_PASSWORD=alerteye_dev \
  -p 5433:5432 postgres:18-alpine
```

Seed demo data (categories, ~16 products, services, pages, homepage, and an admin
user `admin@alerteye.co.ke` / `ChangeMe123!`):

```bash
pnpm seed
```

The Postgres adapter auto‑pushes schema in dev. For production use migrations:

```bash
pnpm migrate:create
pnpm migrate
```

### Useful scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm seed` | Load demo data (skips if products already exist) |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `pnpm generate:importmap` | Regenerate the admin import map (also runs on `prebuild`) |
| `pnpm exec tsx src/seed/smoke.ts` | End‑to‑end order + payment + stock check |

---

## Environment variables

See `.env.example`. Essentials:

| Var | Notes |
|---|---|
| `DATABASE_URI` | Postgres connection string (use the **pooled** URL on serverless) |
| `PAYLOAD_SECRET` | Long random string |
| `NEXT_PUBLIC_SERVER_URL` | Public site URL |
| `S3_*`, `NEXT_PUBLIC_S3_PUBLIC_URL` | R2/S3 media storage (prod). Unset → local disk |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_STAFF_INBOX` | Transactional email |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Enables the Paystack checkout option |
| `MPESA_*` | Safaricom Daraja — enables the "M‑Pesa STK push" option |
| `NEXT_PUBLIC_MPESA_PAYBILL`, `NEXT_PUBLIC_BANK_DETAILS` | Shown for manual payments |
| `MPESA_ALLOWED_IPS` | Optional allow‑list for the M‑Pesa callback |

Payment options at checkout appear only when their provider is configured; manual
M‑Pesa / bank transfer / pay‑on‑delivery are always available.

### Payment webhooks

Point the providers at:

- Paystack: `https://<domain>/api/webhooks/paystack` (signature‑verified)
- Daraja STK callback: `https://<domain>/api/webhooks/mpesa` (`MPESA_CALLBACK_URL`)

Both handlers are idempotent — stock is decremented exactly once per order.

---

## Deployment (recommended: Vercel + Neon + Cloudflare R2)

1. **Database** — create a Neon Postgres project; set `DATABASE_URI` to the pooled
   connection string.
2. **Media** — create a Cloudflare R2 bucket + API token; set `S3_BUCKET`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`
   (`https://<accountid>.r2.cloudflarestorage.com`), `S3_REGION=auto`, and
   `NEXT_PUBLIC_S3_PUBLIC_URL` (the bucket's public URL). Add that hostname is
   already whitelisted in `next.config.mjs` via the env var.
3. **Vercel** — import the repo, add all env vars, deploy. Build command
   `pnpm build` (runs `payload generate:importmap` first). Note: a commercial
   store requires the Vercel **Pro** plan.
4. **Email** — verify your sending domain in Resend.
5. **First run** — run `pnpm migrate` against the prod DB, then create the first
   admin user at `/admin`, or run `pnpm seed` once for demo content.
6. **Backups** — Neon PITR covers short windows; add a scheduled `pg_dump` to R2
   for longer retention.

Approx. fixed hosting cost: ~$0 on free tiers while building, ~$20/mo once live
(Vercel Pro), everything else usage‑based. See `plan` docs for the full breakdown.

---

## Staff guide (quick)

- **Add a product:** Catalog → Products → Create. Set price (KES), stock, category,
  images, and Status = *Active* to publish.
- **Process an order:** Sales → Orders. Confirm payment (mark *Paid* for manual
  M‑Pesa/bank once received), then advance *Fulfillment status*. The customer is
  emailed on each change and can track it at `/order/<number>`.
- **Handle a service request:** Services → Service Requests. Fill the *Quote* group
  and set status → *Quoted* (customer accepts in their account). Assign a
  *Technician*, set *Scheduled start/end*, then move through
  *In progress* → *Completed*.
- **Site content:** Content → Homepage (hero, featured items, testimonials) and
  Settings → Site Settings (contact details, WhatsApp number, delivery rates,
  announcement bar).
