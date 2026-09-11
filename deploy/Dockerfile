# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# Alert Eye Electronics — production image
#
# One Next.js process serves the storefront + the Payload admin/API.
# The image ships the full dependency tree so `payload migrate` and the
# seed script run in the same container. `next build` is run at deploy time
# (see deploy/scripts/deploy.sh) against a reachable database, and the
# compiled .next output is shared back through a named volume.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# openssl: pg / node crypto ;  curl: container healthcheck ;  tini: signal handling
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl curl tini \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@11
WORKDIR /app

# ---- dependencies (cached on lockfile) ------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# More forgiving fetch settings for slow / flaky links.
RUN pnpm config set fetch-retries 8 \
 && pnpm config set fetch-retry-maxtimeout 180000 \
 && pnpm config set fetch-timeout 900000 \
 && pnpm config set network-concurrency 4
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# ---- runtime image ------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces inside the container network
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Bake the admin import map (no DB / secret needed) so every container has a
# current copy regardless of what the deploy-time build produces.
RUN DATABASE_URI=postgres://build:build@127.0.0.1:1/build PAYLOAD_SECRET=build-only \
    pnpm exec payload generate:importmap

# Pre-create the build dir so the shared named volume inits as node-owned.
RUN mkdir -p /app/.next && chown -R node:node /app
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD curl -fsS http://localhost:3000/api/access >/dev/null || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "start"]
