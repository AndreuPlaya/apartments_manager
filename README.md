# Apartments Manager (IxaGrupPortal)

A self-hosted, multi-user apartment management application for tracking bookings, clients, and billing across a portfolio of short-term and long-term rental properties.

## Features

- **Booking calendar** — track arrivals, departures, and billing per apartment
- **Client management** — store guest/tenant details and identity documents
- **Channel tracking** — manage booking sources (Airbnb, Booking.com, direct, etc.) with commission rates
- **Role-based access** — admin users have full read/write access; regular users have read-only access
- **Audit trail** — immutable log of all accepted changes
- **Self-hosted** — single Docker container with no external database required

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20, ESM |
| HTTP framework | Hono 4.x |
| Frontend | Vue 3 (Composition API) |
| Build | Vite 5.x (client), tsup (server) |
| Auth | JWT via jose 5.x, httpOnly cookie |
| Persistence | JSON files (no database) |
| Styling | SCSS + CSS custom properties |
| Monorepo | pnpm workspaces |
| Deployment | Docker + Compose |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Development

```bash
# Install dependencies
pnpm install

# Run server and client in separate terminals
pnpm dev:server   # Hono API on :5000
pnpm dev:client   # Vite dev server with proxy
```

On first boot, if no admin user exists the app redirects to `/setup` to create one.

### Production (Docker)

```bash
docker compose up --build
```

The app is available at `http://localhost:8081`. All data is stored in `./data` (bind-mounted into the container at `/data`). Backing up the app means copying that directory.

### Production (manual)

```bash
pnpm build    # builds client then server
pnpm start    # starts Hono on :5000
```

## Project Structure

```
apartments_manager/
├── packages/
│   ├── server/src/
│   │   ├── domain/          # Pure types and functions (no I/O)
│   │   ├── infrastructure/  # File I/O (settings.json, data files)
│   │   ├── application/     # Business rules and authorization
│   │   ├── middleware/       # auth, admin guards
│   │   └── routes/          # auth, editor, admin endpoints
│   └── client/src/
│       ├── pages/
│       ├── components/
│       ├── composables/
│       ├── api/             # Typed API client
│       └── router.ts
├── data/                    # Gitignored — volume-mounted in Docker
├── docs/
│   └── ARCHITECTURE_BLUEPRINT.md
├── compose.yaml
└── Dockerfile
```

## Running Tests

```bash
pnpm test              # all tests
pnpm test:server       # server only
pnpm test:client       # client only
```

## Data & Backup

All persistent data lives in `./data/`. There is no external database.

```
data/
├── config/        # settings.json (users, secret key)
└── input_data/    # apartments, bookings, clients, channels
```

To back up: copy the `data/` directory. To restore: replace it.

## Architecture

The server follows a strict dependency rule — layers depend inward only:

```
Routes → Application Services → Infrastructure → Domain
```

- **Domain**: TypeScript interfaces and pure functions, zero I/O
- **Infrastructure**: all file writes use atomic temp+rename to prevent corruption
- **Application**: all business rules and authorization checks
- **Routes**: HTTP contract only — no business logic
