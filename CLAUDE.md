# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**apartments_manager** is a self-hosted, multi-user apartment management application (IxaGrupPortal) being rebuilt from scratch. Its core purpose is to track a **calendar of apartment bookings** — who arrives, who leaves, how much to bill — across a portfolio of short-term and long-term rental properties.

The new application follows the architecture in `docs/ARCHITECTURE_BLUEPRINT.md` exactly.

The public-facing (non-authenticated) homepage is **out of scope** — it will be a separate WordPress site. This application only serves authenticated users.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24, ESM throughout |
| Persistence | SQLite via `node:sqlite` (builtin, no dependency) |
| HTTP framework | Hono 4.x |
| JWT | jose 5.x (HS256, httpOnly cookie, 7-day maxAge) |
| Password hashing | bcryptjs 2.x (12 salt rounds) |
| Frontend | Vue 3 (Composition API, `<script setup>`) |
| Build: frontend | Vite 5.x |
| Build: server | tsup |
| Monorepo | pnpm workspaces 9.x |
| Styling | SCSS (Sass 1.x) with CSS custom properties for theming |
| Testing | Vitest |
| Containerization | Docker + Compose (single container, bind-mounted data volume) |

---

## Repository Layout

```
apartments_manager/
├── packages/
│   ├── server/src/
│   │   ├── domain/          # Pure types + pure functions (no I/O)
│   │   ├── infrastructure/  # I/O only (SQLite, settings.json)
│   │   │   └── repositories/  # one module per entity — all SQL lives here
│   │   ├── application/     # Business rules and authorization
│   │   ├── middleware/      # auth.ts, admin.ts (cross-cutting only)
│   │   ├── routes/          # auth.ts, editor.ts, admin.ts
│   │   └── index.ts
│   └── client/src/
│       ├── pages/
│       ├── components/
│       ├── composables/     # useAsyncOp, usePageData, useToast, useConfirm, useAppConfig
│       ├── api/             # client.ts — typed api object
│       ├── styles/          # _variables.scss with CSS custom properties
│       └── router.ts
├── data/                    # Volume-mounted; gitignored
│   ├── database/            # app.db (+ -wal/-shm) — created on first boot
│   └── config/              # settings.json (auto-created on first boot)
├── docs/
│   └── ARCHITECTURE_BLUEPRINT.md
├── compose.yaml
├── Dockerfile
└── pnpm-workspace.yaml
```

---

## Commands

```bash
# Install all dependencies (run from repo root)
pnpm install

# Development (run in separate terminals)
pnpm dev:server    # Hono server with hot-reload
pnpm dev:client    # Vite dev server with proxy to :5000

# Production build (client must build first)
pnpm build         # builds client then server

# Start production server
pnpm start

# Tests
pnpm test                        # all tests
pnpm -F server test              # server tests only
pnpm -F server test src/domain   # single file or directory
pnpm -F client test              # client tests only

# Docker
docker compose up --build        # build and run
docker compose up -d             # detached
docker compose logs -f app       # follow logs
```

---

## Server Architecture — Dependency Rule

Layers depend **inward only**: Routes → Application → Infrastructure → Domain. No layer imports from a layer outside its boundary. Domain has zero I/O.

```
Routes (HTTP contract only)
  └── Application Services (all business rules + authorization checks)
        └── Infrastructure (I/O only: SQLite repositories, settings.json)
              └── Domain (TypeScript interfaces + pure functions)
```

Key invariants:
- **Domain** (`domain/models.ts`): interfaces only, no classes. Pure transform functions beside them.
- **Infrastructure**: `infrastructure/repositories/*.ts` hold every SQL statement, one module per entity, each exposing `list` / `findById` / `insert` / `update` / `deleteById` plus the lookups its service needs. `infrastructure/db.ts` owns the connection, the pragmas (`WAL`, `foreign_keys`, `busy_timeout`) and the `transaction()` helper. `infrastructure/settings.ts` still writes `settings.json` with the atomic temp+rename pattern.
- **Schema changes** go in `infrastructure/migrations.ts` as a new append-only entry — never edit an applied migration. They run automatically on the first `getDb()`.
- **Application services** receive plain data arguments (never Hono `Context`) so they are testable without HTTP.
- **Routes** map request → service call → response. No business logic.
- **Middleware** `auth.ts` sets `c.get('user')`; `admin.ts` checks `user.isAdmin`. Admin routes stack both.

---

## Authentication

Single `session` cookie: `httpOnly: true`, `sameSite: 'Lax'`, `maxAge: 604800` (7 days). Signed with HS256 via jose. No refresh token — the single cookie handles session lifetime. Auto-logout happens naturally when `maxAge` expires; the frontend clears its cached config on 401.

Two user types in `settings.json`:
- `admin_users`: pure operators, full read/write access to all data (can add/edit apartments, bookings, clients, channels).
- `users`: employees with **read-only access** — they can view the apartment calendar, upcoming arrivals/departures, client details, and billing amounts, but cannot mutate data.

First-run flow: `ensureSecretKey()` generates the secret on startup. If no admin exists, the API redirects to setup state; the Vue router guard sends the user to `/setup`.

---

## Domain Model

Entities the application manages:
- **Apartment**: bookable unit (name, address, floor, door, price, minNights, maxGuests, rooms, bathrooms)
- **Booking**: apartment reservation (apartment ref, client ref, channel ref, fromDate, toDate, adultCount, childrenCount, status, totalAmountDue). Has overlap validation — dates cannot conflict within the same apartment.
- **Client**: guest/tenant (identityDocument, name, email, phoneNumber, address fields)
- **Channel**: booking source (name, commissionRate, isActive) — e.g. Airbnb, Booking.com, direct

All persistent data lives in `$DATA_DIR` (env var, defaults to `.`): the SQLite file at `$DATA_DIR/database/app.db` plus `$DATA_DIR/config/settings.json`. No database server — SQLite is embedded via the `node:sqlite` builtin.

Integrity the schema enforces (so services do not have to): unique names for apartments, properties and channels (case-insensitive); unique client document and email; foreign keys from bookings to apartment/client/channel with `ON DELETE RESTRICT`; calendar links cascade when their apartment or channel is deleted.

Booking overlap has no SQL equivalent (SQLite lacks exclusion constraints), so `bookingService` runs the check and the write inside one `transaction()` — `BEGIN IMMEDIATE` takes the write lock up front, so two concurrent requests cannot both pass the check.

---

## Migrating from the JSON files

`infrastructure/importJson.ts` runs on every boot and does nothing unless legacy JSON files are present *and* the database is still empty. It imports all six entities in one transaction, then renames each `*.json` to `*.json.migrated`.

If any record is rejected (duplicate name, missing foreign key), the whole import rolls back, the JSON files are left untouched and the server fails to start with a report naming every offending record. Fix the JSON and restart. To retry from scratch: delete `app.db*` and rename the `.migrated` files back.

---

## Frontend Patterns

- **`api/client.ts`**: single typed `api` object with namespaced groups (`api.auth.*`, `api.bookings.*`, `api.admin.*`, etc.). All components import from this object.
- **`composables/useAsyncOp.ts`**: wraps async calls with `loading` ref and toast error handling.
- **`composables/usePageData.ts`**: loads all page data in parallel (`Promise.all`), exposes mutation helpers.
- **`router.ts` guard**: calls `GET /api/auth/config`, caches result in module scope, clears on login/logout. Redirects unauthenticated users to `/login` (or `/setup` if no admin exists).
- **Theming**: CSS custom properties defined in `styles/_variables.scss`; theme switching via `document.documentElement.setAttribute('data-theme', theme)`.

---

## Docker Deployment

Single container. `./data` is bind-mounted at `/data` inside the container (`DATA_DIR=/data`). Backing up the app = copying the `data/` directory — stop the container first, or use `sqlite3 app.db ".backup out.db"` for a hot copy (WAL means a plain `cp` of a live database can catch a partial write).

Build order in Dockerfile: deps → client build → server build → final image (copies server dist + client dist + node_modules).

Port mapping: `8080:5000` (external:internal). Hono listens on `0.0.0.0:5000`.
