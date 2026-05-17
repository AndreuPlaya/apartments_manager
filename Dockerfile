# syntax=docker/dockerfile:1

# ── Base ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# ── Dependencies ───────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/client/package.json ./packages/client/package.json
RUN pnpm install --frozen-lockfile

# ── Client build ───────────────────────────────────────────────────────────
FROM deps AS client-build
WORKDIR /app
COPY packages/client ./packages/client
RUN pnpm -F client build

# ── Server build ───────────────────────────────────────────────────────────
FROM deps AS server-build
WORKDIR /app
COPY packages/server ./packages/server
RUN pnpm -F server build

# ── Production image ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=server-build /app/packages/server/dist ./packages/server/dist
COPY --from=client-build /app/packages/client/dist ./packages/client/dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

RUN mkdir -p /data/data /data/config
VOLUME ["/data"]

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=5000

EXPOSE 5000

CMD ["node", "packages/server/dist/index.js"]
