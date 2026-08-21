# syntax=docker/dockerfile:1

# ── Base ───────────────────────────────────────────────────────────────────
FROM node:24-alpine AS base
RUN npm install -g pnpm@9

# ── Dependencies ───────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/client/package.json ./packages/client/package.json
RUN pnpm install --frozen-lockfile

# ── Tests ──────────────────────────────────────────────────────────────────
# Etapa propia para que la pipeline pueda ejecutarlos con `--target tests` sin
# necesitar Node en el contenedor del job: le basta el cliente de Docker.
# No entra en la imagen final —nada la referencia— así que no la engorda.
FROM deps AS tests
WORKDIR /app
COPY packages/client ./packages/client
COPY packages/server ./packages/server
RUN pnpm test

# ── Client build ───────────────────────────────────────────────────────────
FROM deps AS client-build
WORKDIR /app
# Techo del heap de V8. docker-host va justo de memoria y quien se dispara
# durante el build es vite/tsup; sin esto el pico ronda los 768 MB.
ARG NODE_OPTIONS=""
ENV NODE_OPTIONS=$NODE_OPTIONS
COPY packages/client ./packages/client
RUN pnpm -F client build

# ── Server build ───────────────────────────────────────────────────────────
FROM deps AS server-build
WORKDIR /app
ARG NODE_OPTIONS=""
ENV NODE_OPTIONS=$NODE_OPTIONS
COPY packages/server ./packages/server
RUN pnpm -F server build

# ── Production image ───────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

RUN apk add --no-cache su-exec
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=server-build /app/packages/server/dist ./packages/server/dist
COPY --from=client-build /app/packages/client/dist ./packages/client/dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN mkdir -p /data/database /data/config && chown -R appuser:appgroup /app /data
VOLUME ["/data"]

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=5000

EXPOSE 5000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "packages/server/dist/index.js"]
