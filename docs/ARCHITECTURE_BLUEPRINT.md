# Application Architecture Blueprint

This document describes the architecture, security model, and technology choices of this application in domain-agnostic terms. Its purpose is to serve as a starting prompt or reference for building a new application with the same structural patterns — authentication, role-based access, file-based persistence, an approval queue, and a self-hosted Docker deployment — regardless of what business domain it manages.

---

## 1. What This Architecture Produces

A **self-hosted, multi-user web application** with:

- Cookie-based JWT authentication with two user roles (admin and regular user)
- A Vue 3 SPA frontend served from the same process as the API
- File-based persistence (JSON + plain text) — no external database required
- An admin-controlled approval workflow for user-submitted changes
- A full audit trail of all accepted changes (immutable append-only log)
- Single Docker container deployment with a mounted data volume

This pattern fits well for internal tools, small-team SaaS, and self-hosted productivity apps where:
- The data set is not so large that a database is required
- Auditability and traceability of changes matters
- Simple ops (one compose command) is preferred over infrastructure complexity

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js >= 20 | ESM modules throughout |
| HTTP framework | Hono 4.x | Lightweight, edge-compatible, Zod-friendly |
| JWT | jose 5.x | Standards-compliant; supports HS256 |
| Password hashing | bcryptjs 2.x | Salt rounds 12 |
| Frontend framework | Vue 3 (Composition API) | `<script setup>` style |
| Frontend build | Vite 5.x | Dev server with proxy; production ESM bundle |
| Server build | tsup | Single-file ESM output; fast |
| Monorepo | pnpm workspaces >= 9 | Two packages: `server`, `client` |
| Styling | SCSS (Sass 1.x) | CSS custom properties for theming |
| Containerization | Docker + Compose | Single container; data as bind mount |
| Testing | Vitest | Co-located unit tests per layer |
| Type checking | TypeScript (strict) | Shared interfaces between layers |

---

## 3. Repository Layout

```
project-root/
├── packages/
│   ├── server/          # Hono API server
│   │   └── src/
│   │       ├── domain/
│   │       ├── infrastructure/
│   │       ├── application/
│   │       ├── middleware/
│   │       ├── routes/
│   │       └── index.ts
│   └── client/          # Vue 3 SPA
│       └── src/
│           ├── pages/
│           ├── components/
│           ├── composables/
│           ├── api/
│           ├── styles/
│           └── router.ts
├── data/                # Volume-mounted persistent data (gitignored)
│   ├── input_data/      # Domain-specific raw data files
│   ├── corrections/     # Pending queue + history log
│   └── config/          # settings.json + secret key
├── compose.yaml
├── Dockerfile
├── pnpm-workspace.yaml
└── package.json         # Root scripts only
```

**Root `package.json` scripts follow the pattern:**

```json
{
  "scripts": {
    "dev:server": "pnpm -F server dev",
    "dev:client": "pnpm -F client dev",
    "build": "pnpm -F client build && pnpm -F server build",
    "start": "pnpm -F server start"
  }
}
```

Build order matters: client runs first so `packages/client/dist/` exists when the server starts serving static assets.

---

## 4. Server Architecture — Layered Design

The server follows a strict **unidirectional dependency rule**: outer layers depend on inner layers, never the reverse. No layer imports from a layer outside its boundary.

```
Routes
  └── Application Services
        └── Infrastructure (I/O)
              └── Domain (pure types + pure functions)
```

### 4.1 Domain Layer (`src/domain/`)

**Rule: zero I/O, zero side effects.**

- `models.ts` — TypeScript interfaces only (no classes, no logic). Defines the shape of every entity in the system.
- `parser.ts` / `calculator.ts` (or whatever is appropriate for the domain) — pure functions that transform data. These are trivially unit-testable because they have no dependencies.

**Example model structure:**

```typescript
// models.ts
export interface ResourceItem {
  id: string
  ownerId: string
  category: string
  createdAt: string
  // ...domain fields
}

export interface ChangeRecord {
  id: string           // UUID
  action: 'ADD' | 'EDIT' | 'DEL'
  resourceId: string
  payload: Partial<ResourceItem>
  submittedAt: string
  submittedBy: string
  // ...applied_at, applied_by when moved to history
}
```

### 4.2 Infrastructure Layer (`src/infrastructure/`)

**Rule: only I/O and data format concerns. No business logic.**

- `settings.ts` — `loadSettings()` / `saveSettings()` / `ensureSecretKey()` / `findUser()`. Reads and writes `config/settings.json`.
- `data.ts` — CRUD operations on the domain-specific data files. Provides `loadItems()`, `saveItems()`, `loadPending()`, `savePending()`, `loadHistory()`, `saveHistory()`.
- `reporter.ts` (optional) — formatting helpers (dates, durations, display values). Pure output-formatting, no decisions.

**Atomic write pattern** (use everywhere JSON files are saved):

```typescript
import { writeFileSync, renameSync } from 'fs'

function saveJson(path: string, data: unknown): void {
  const tmp = path + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, path)   // atomic on most POSIX filesystems
}
```

This guarantees that a crash mid-write leaves the previous file intact rather than a corrupted partial file.

### 4.3 Application Layer (`src/application/`)

**Rule: orchestrates use cases. Contains all business rules and authorization checks.**

One service file per major concern:

- `userService.ts` — authentication, password verification, user CRUD, role checks
- `itemService.ts` (domain-specific) — CRUD for the primary resource
- `correctionService.ts` — approval queue: submit, approve, reject, cancel
- `reportService.ts` — query and format data for the frontend
- `appConfigService.ts` — read/write application-wide UI settings

Services call infrastructure functions. Services never import from routes. Services receive plain data arguments (no Hono `Context` objects) so they remain framework-agnostic and testable.

**Authorization branching pattern** (used in correction/change submission):

```typescript
// correctionService.ts
export function submitChange(
  action: ChangeAction,
  payload: unknown,
  submittedBy: string,
  isAdmin: boolean
): boolean {  // returns true if queued (pending), false if applied immediately
  if (!canSubmitFor(payload.ownerId, submittedBy, isAdmin)) {
    throw new ForbiddenError('Cannot modify another user\'s data')
  }

  if (isAdmin) {
    recordHistory({ ...payload, appliedBy: submittedBy, appliedAt: now() })
    return false   // applied immediately
  } else {
    queuePending({ ...payload, submittedBy, submittedAt: now(), id: uuid() })
    return true    // queued for approval
  }
}
```

The route reads the return value to vary the HTTP response:

```typescript
const pending = submitChange(action, payload, user.username, user.isAdmin)
return c.json({ ok: true, ...(pending && { pending: true }) })
```

The frontend reads the `pending` flag to show either a success toast or an "awaiting approval" toast.

### 4.4 Middleware Layer (`src/middleware/`)

**Rule: cross-cutting concerns only. No business logic.**

- `auth.ts` — extracts and verifies the JWT cookie. Populates `c.get('user')` with `{ username, isAdmin, resourceOwnerId }`. Returns 401 if the token is missing, expired, or invalid.
- `admin.ts` (or inline) — checks `user.isAdmin`. Returns 403 if not admin. Applied on top of `authMiddleware` for admin-only route groups.

**Hono type-safe context extension:**

```typescript
declare module 'hono' {
  interface ContextVariableMap {
    user: SessionUser
  }
}
```

This lets route handlers call `c.get('user')` with full TypeScript type inference.

### 4.5 Routes Layer (`src/routes/`)

**Rule: HTTP contract only. Map request to service call to response. No business logic.**

Split into at least three files:

- `auth.ts` — `/api/auth/login`, `/api/auth/logout`, `/api/auth/setup`, `/api/auth/config`
- `editor.ts` — user-facing routes (protected by `authMiddleware`): resource reads, self-service edits
- `admin.ts` — admin-only routes (protected by `authMiddleware` + `adminMiddleware`): all CRUD, approval queue management, user management

Route handlers follow this pattern:

```typescript
app.post('/api/items/:id/edit', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<EditRequest>()
  const pending = await itemService.submitEdit(body, user.username, user.isAdmin)
  return c.json({ ok: true, pending })
})
```

### 4.6 Entry Point (`src/index.ts`)

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { ensureSecretKey } from './infrastructure/settings.js'
import authRoutes from './routes/auth.js'
import editorRoutes from './routes/editor.js'
import adminRoutes from './routes/admin.js'

ensureSecretKey()   // generate + persist secret if first boot

const app = new Hono()
app.route('/', authRoutes)
app.route('/', editorRoutes)
app.route('/', adminRoutes)
app.use('/assets/*', serveStatic({ root: '../client/dist' }))
app.get('*', c => c.html(readFileSync('../client/dist/index.html', 'utf8')))

serve({ fetch: app.fetch, port: 5000, hostname: '0.0.0.0' })
```

The SPA fallback (`*` → `index.html`) is what makes Vue Router work for deep-linked URLs.

---

## 5. Authentication System

### 5.1 Two User Types

**Admin accounts** are stored in `settings.json` under `admin_users`. They:
- Have no association to a resource entity (they are pure operators)
- Have full access to all admin routes
- Can approve or reject pending changes
- Can manage all user accounts

**Resource-user accounts** are stored in `settings.json` under `users` (keyed by a resource-specific ID). They:
- Are associated with a specific entity in the domain (e.g., a tenant, an employee, a customer)
- Can only access their own data by default
- Submit changes that go into the approval queue
- Can optionally have `is_admin: true` to gain elevated privileges while retaining their resource association

### 5.2 Settings Schema

```typescript
interface Settings {
  secret_key: string                        // 64-char hex, auto-generated
  admin_users: Record<string, AdminRecord>  // username → hash
  users: Record<string, UserRecord>         // resourceId → user record
  app_config?: AppConfig
}

interface UserRecord {
  username: string
  password_hash: string    // bcrypt $2b$...
  full_name: string
  display_name: string     // short alias for UI
  is_admin: boolean
  enabled: boolean         // false = soft-deleted; login rejected
  email?: string
}

interface AppConfig {
  theme?: string
  date_format?: string
  time_format?: '12h' | '24h'
  favicon_ext?: string
}
```

### 5.3 JWT Cookie Flow

**Login:**

```
POST /api/auth/login  {username, password}
  → userService.authenticate()
  → bcrypt.compare(password, stored_hash)
  → jose.SignJWT({username, isAdmin, resourceId}).sign(secret)
  → setCookie('session', token, { httpOnly: true, sameSite: 'Lax', maxAge: 604800 })
  → 200 { ok: true, is_admin: bool, resource_id: string|null }
```

**Protected request:**

```
GET /api/items  Cookie: session=<token>
  → authMiddleware
  → jose.jwtVerify(token, secret)
  → c.set('user', { username, isAdmin, resourceId })
  → route handler
```

**Logout:**

```
POST /api/auth/logout
  → deleteCookie('session')
  → 200 { ok: true }
```

### 5.4 First-Run Setup

On startup, `ensureSecretKey()` generates a random 32-byte hex secret and writes it to `settings.json` if one does not already exist.

If `admin_users` is empty, all API routes (except `/api/auth/*`) redirect to a setup state. The frontend router guard detects this and sends the user to `/setup`. Once an admin is created via `POST /api/auth/setup`, the flag clears and normal operation begins.

### 5.5 Password Hashing

All new passwords are hashed with bcrypt at 12 salt rounds:

```typescript
import bcrypt from 'bcryptjs'

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12)
}

export function verifyPassword(plain: string, stored: string): boolean {
  return bcrypt.compareSync(plain, stored)
}
```

If migrating from a Python app (Flask/werkzeug), the legacy PBKDF2-SHA256 format can be verified transparently using Node's `crypto.pbkdf2Sync`. New passwords written after migration will use bcrypt. No forced password reset is required.

---

## 6. File-Based Persistence

### 6.1 Data Directory Layout

All persistent data lives under `DATA_DIR` (an environment variable, default `.`):

```
$DATA_DIR/
├── input_data/          # Domain-specific source files (raw imports)
├── corrections/
│   ├── pending.json     # Queued changes awaiting admin approval
│   └── history.json     # Approved and applied changes (append-only)
└── config/
    └── settings.json    # Users, secret key, app config
```

### 6.2 Why No Database

For single-server, low-write-frequency internal tools, JSON files are sufficient and have advantages:

- **Zero infrastructure** — no DB process, no connection strings, no migrations
- **Human-readable** — files can be inspected, backed up with `cp`, and version-controlled during development
- **Portable** — the data volume is just a directory; no DB dump/restore needed for backups
- **Auditable** — history.json is a flat append-only log that can be `grep`'d

The tradeoff: this does not scale to high write concurrency or large datasets. If either becomes a concern, the infrastructure layer is the only thing that needs to change (swap file I/O for a DB client in `infrastructure/data.ts`).

### 6.3 Atomic Writes

Every write to a JSON file uses the temp-file rename pattern:

```typescript
function saveJson<T>(filePath: string, data: T): void {
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, filePath)
}
```

`renameSync` is atomic on POSIX filesystems (Linux, macOS). If the process crashes between write and rename, the `.tmp` file is orphaned but the original remains intact.

---

## 7. Approval Queue Pattern

This pattern lets regular users propose changes that only take effect after admin review.

### 7.1 Data Structures

**`pending.json`** — mutable array of queued items:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "action": "EDIT",
    "resourceId": "42",
    "payload": { "field": "old_value", "newField": "new_value" },
    "submittedAt": "2026-05-07T10:30:00Z",
    "submittedBy": "alice"
  }
]
```

**`history.json`** — immutable append-only log:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "action": "EDIT",
    "resourceId": "42",
    "payload": { "field": "old_value", "newField": "new_value" },
    "submittedAt": "2026-05-07T10:30:00Z",
    "submittedBy": "alice",
    "appliedAt": "2026-05-07T11:00:00Z",
    "appliedBy": "admin",
    "undone": false
  }
]
```

History items are never deleted. To "undo" a change, an `undone: true` flag is set on the record and the reverse operation is appended as a new record.

### 7.2 Queue Lifecycle

```
User submits change
  → correctionService.submitChange(payload, user, isAdmin)
  → if isAdmin: append to history.json immediately
  → if not admin: append to pending.json with UUID

Admin views pending list
  → GET /api/admin/pending → list all items in pending.json

Admin previews a pending item
  → GET /api/admin/pending/:id/preview
  → compute "before" state (current data without applying item)
  → compute "after" state (current data with item applied hypothetically)
  → return { before, after } for side-by-side UI display

Admin approves
  → POST /api/admin/pending/:id/approve
  → remove from pending.json
  → append to history.json with appliedAt + appliedBy

Admin rejects
  → POST /api/admin/pending/:id/reject
  → remove from pending.json (no history entry)

User cancels own pending item
  → DELETE /api/my-pending/:id
  → only allowed if submittedBy matches current user
  → remove from pending.json
```

### 7.3 Access Control Matrix

| Action | Regular User | Admin |
|---|---|---|
| Submit change for own resource | Queued (pending) | Applied immediately |
| Submit change for another resource | Forbidden | Applied immediately |
| View own pending items | Own only | All (via admin panel) |
| Cancel pending item | Own only | Any |
| Approve / reject pending | No | Yes |
| View history | No | Yes |
| Undo history item | No | Yes |

### 7.4 Preview Logic

The before/after preview is computed inline on every request — there is no stored "snapshot":

```typescript
export function getPreview(item: PendingItem) {
  const currentState = loadCurrentData()             // real data
  const before = computeView(currentState, item.resourceId)
  const after = computeView(applyItem(currentState, item), item.resourceId)
  return { before, after, affectedId: item.resourceId }
}
```

This means the preview always reflects the latest real state, even if other changes happened after the item was queued.

---

## 8. Frontend Architecture

### 8.1 Router and Auth Guard

`router.ts` defines all SPA routes. The `beforeEach` guard enforces authentication and role requirements:

```typescript
let cachedConfig: AuthConfig | null = null

router.beforeEach(async (to) => {
  if (!cachedConfig) {
    try {
      cachedConfig = await api.auth.config()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        const needsSetup = await api.auth.setupStatus()
        return needsSetup ? '/setup' : '/login'
      }
    }
  }

  if (to.meta.adminOnly && !cachedConfig.is_admin) return '/'
})
```

**Cache invalidation:** `cachedConfig` is cleared on logout and on login. This avoids a network round-trip on every navigation while ensuring stale state is not carried across sessions.

### 8.2 Typed API Client

A single file (`api/client.ts`) defines all API calls and their TypeScript types:

```typescript
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...options })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json()
}

export const api = {
  auth: {
    login: (body: LoginRequest) => request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    config: () => request<AuthConfig>('/api/auth/config'),
  },
  items: {
    list: () => request<Item[]>('/api/items'),
    add: (body: AddItemRequest) => request<MutationResponse>('/api/items', { method: 'POST', body: JSON.stringify(body) }),
    edit: (id: string, body: EditItemRequest) => request<MutationResponse>(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  admin: {
    pending: () => request<PendingItem[]>('/api/admin/pending'),
    approve: (id: string) => request<void>(`/api/admin/pending/${id}/approve`, { method: 'POST' }),
    reject: (id: string) => request<void>(`/api/admin/pending/${id}/reject`, { method: 'POST' }),
    users: () => request<UserRecord[]>('/api/admin/users'),
    // ...
  },
}
```

All components import from this single object. Type errors surface at the call site.

### 8.3 Composables

**`useAsyncOp()`** — wraps any async call with loading state and toast-based error handling:

```typescript
export function useAsyncOp() {
  const loading = ref(false)
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    try {
      return await fn()
    } catch (e) {
      if (e instanceof ApiError) useToast().error(e.message)
    } finally {
      loading.value = false
    }
  }
  return { loading, run }
}
```

**`usePageData()`** (rename per domain) — central composable for the main page. Loads all data in parallel, exposes mutation helpers, handles optimistic state:

```typescript
export function usePageData() {
  const items = ref<Item[]>([])
  const pending = ref<PendingItem[]>([])
  const config = ref<AuthConfig | null>(null)
  const { run } = useAsyncOp()

  async function load() {
    const [itemsData, pendingData, configData] = await Promise.all([
      api.items.list(), api.myPending(), api.auth.config()
    ])
    items.value = itemsData
    pending.value = pendingData
    config.value = configData
  }

  async function submitEdit(id: string, body: EditItemRequest) {
    const res = await run(() => api.items.edit(id, body))
    if (res?.pending) useToast().info('Submitted for approval')
    else if (res?.ok) useToast().success('Saved')
    await refresh()
  }

  return { items, pending, config, load, submitEdit }
}
```

**`useToast()`** — singleton reactive toast queue. Components call `useToast().success/error/info()`.

**`useConfirm()`** — singleton modal for destructive action confirmation.

**`useAppConfig()`** — lazy singleton that fetches application-wide UI config once per session and applies the active theme.

### 8.4 Pages

| Route | Page | Who |
|---|---|---|
| `/login` | LoginPage | Public |
| `/setup` | SetupPage | Public (first-run only) |
| `/` | MainPage | All authenticated users |
| `/admin` | AdminPage | Admin only |
| `/items/:id` | DetailPage | Owner or admin |

**MainPage** uses `usePageData()`. Its template conditionally shows admin UI elements based on `config.is_admin`. All editing goes through the composable's mutation helpers.

**AdminPage** is a tabbed view covering: user management, pending approval queue, change history, raw data files, app config.

### 8.5 Theming

One SCSS file (`styles/_variables.scss`) defines all design tokens as both SCSS variables (for compile-time use) and CSS custom properties (for runtime theme switching):

```scss
:root {
  --accent: #{$accent};
  --bg: #{$bg};
  --card: #{$card};
  --text: #{$text};
  --border: #{$border};
  --radius-md: #{$radius-md};
}
```

Theme switching is applied by updating `document.documentElement.setAttribute('data-theme', theme)` and matching CSS rules:

```css
[data-theme="blue"] {
  --accent: #3b82f6;
  --accent-dark: #1d4ed8;
}
```

---

## 9. Security Principles

### 9.1 Cookie-Based JWT

| Property | Value | Why |
|---|---|---|
| `httpOnly: true` | Set | JavaScript cannot read the token — XSS cannot steal it |
| `sameSite: 'Lax'` | Set | Browser sends cookie on same-site navigations and form POSTs; blocks cross-site requests |
| `path: '/'` | Set | Cookie sent with all requests to the origin |
| `maxAge: 604800` | 7 days | Re-login required after one week |
| Algorithm | HS256 | Symmetric; fast; appropriate for single-server deployments |
| Secret | 32 random bytes (hex) | Auto-generated on first boot; never hardcoded |

**Why not localStorage?** It is accessible to any JavaScript on the page, making it vulnerable to XSS. An httpOnly cookie is never exposed to JavaScript.

### 9.2 Role Enforcement

Auth and role are separate middleware concerns. They compose:

```typescript
// authMiddleware: who is the caller?
// adminMiddleware: is the caller an admin?

adminRoutes.use('*', authMiddleware, adminMiddleware)
editorRoutes.use('*', authMiddleware)
```

This means admin routes always have two checks: token validity AND role. If either fails, the request is rejected before it reaches a route handler.

### 9.3 Ownership Checks in Services

Routes do not enforce ownership — services do. This prevents authorization logic from being accidentally omitted in a new route:

```typescript
// correctionService.ts
export function canModify(targetId: string, requesterId: string, isAdmin: boolean): boolean {
  return isAdmin || targetId === requesterId
}
```

Every mutation service function calls this before proceeding.

### 9.4 File Upload Validation

Three layers, applied in order:

1. **Client**: `<input type="file" accept=".txt">` — browser-level hint (not a security control)
2. **Route**: Check `Content-Type` header and file extension
3. **Application**: Parse the file content against the domain's expected format; reject if invalid

Path traversal is prevented by sanitizing filenames before constructing paths:

```typescript
const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')
const dest = path.join(DATA_DIR, 'input_data', safe)
```

### 9.5 Soft Delete

Users are never hard-deleted from `settings.json`. Instead, `enabled: false` is set. On login, `authenticate()` checks this flag and rejects the attempt. This preserves the association between historical records and the user who created them.

---

## 10. Docker Deployment

### 10.1 compose.yaml Pattern

```yaml
services:
  app:
    build: .
    volumes:
      - ./data:/data
    ports:
      - "8080:5000"
    environment:
      - DATA_DIR=/data
    restart: unless-stopped
```

- `./data` is bind-mounted at `/data` inside the container. All persistent state lives here — backing it up means copying this directory.
- `DATA_DIR=/data` tells the server where to find config, corrections, and input files.
- Port 8080 is the external-facing port (behind a reverse proxy in production). 5000 is the Hono server port.

### 10.2 Dockerfile Pattern

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

# Install all deps
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN pnpm install --frozen-lockfile

# Build client
FROM deps AS client-build
COPY packages/client ./packages/client
RUN pnpm -F client build

# Build server
FROM deps AS server-build
COPY packages/server ./packages/server
RUN pnpm -F server build

# Final image
FROM node:20-alpine
WORKDIR /app
COPY --from=server-build /app/packages/server/dist ./dist
COPY --from=client-build /app/packages/client/dist ./packages/client/dist
COPY --from=deps /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### 10.3 Data Volume Layout

Before first run, create:

```
data/
  input_data/       ← domain-specific raw files
  corrections/      ← auto-created on first write
  config/           ← auto-created on first boot (secret key + empty settings)
```

`config/settings.json` is auto-created by `ensureSecretKey()` on first boot. The setup page creates the first admin account.

---

## 11. Adapting This Blueprint for a New Application

When starting a new project with this architecture, provide the following instructions to the AI:

### System Prompt Template

```
Build a self-hosted web application for managing [DOMAIN] using this architecture:

TECH STACK:
- Backend: Node.js 20, Hono 4.x, TypeScript (strict), jose for JWT, bcryptjs for passwords, tsup for build
- Frontend: Vue 3 (Composition API, <script setup>), Vite 5.x, Vue Router 4.x, SCSS
- Monorepo: pnpm workspaces (packages/server, packages/client)
- Deployment: Docker + compose, bind-mounted data volume
- Testing: Vitest

ARCHITECTURE LAYERS (server):
1. domain/models.ts — TypeScript interfaces for [your entities]
2. domain/[logic].ts — pure functions, no I/O
3. infrastructure/settings.ts — load/save settings.json (users, secret key, app_config)
4. infrastructure/data.ts — load/save domain data files, pending.json, history.json using atomic writes (write .tmp then rename)
5. application/userService.ts — authentication, bcrypt, user CRUD, soft-delete
6. application/correctionService.ts — approval queue: submit queues for regular users, applies immediately for admins; history is append-only
7. application/[domain]Service.ts — domain-specific queries and mutations
8. middleware/auth.ts — extract + verify JWT from httpOnly cookie, set c.get('user')
9. middleware/admin.ts — check user.isAdmin, return 403 if not
10. routes/auth.ts — login, logout, setup, config
11. routes/editor.ts — user-facing CRUD (wrapped in authMiddleware)
12. routes/admin.ts — admin CRUD + pending approval (wrapped in authMiddleware + adminMiddleware)
13. index.ts — mount routes, serve client dist, SPA fallback

FRONTEND PATTERNS:
- router.ts: beforeEach guard calls GET /api/auth/config, caches result, clears on login/logout
- api/client.ts: typed api object with namespaced groups (api.auth.*, api.admin.*, api.items.*)
- composables/useAsyncOp.ts: loading ref + run() wrapper with toast error handling
- composables/usePageData.ts: central data fetcher, parallel Promise.all, mutation helpers
- composables/useToast.ts: singleton toast state
- composables/useAppConfig.ts: lazy singleton, applies theme on load
- styles/_variables.scss: all design tokens as CSS custom properties

SECURITY:
- JWT in httpOnly, sameSite=Lax cookie, 7-day maxAge, HS256
- Secret key auto-generated on first boot, persisted to config/settings.json
- First-run setup page (no admins → redirect to /setup)
- Soft delete only (enabled: false on user records)
- Ownership checks inside application services (not routes)
- File upload: 3-layer validation (client accept attr, route extension check, application content parse)
- Atomic writes everywhere (write .tmp, renameSync)
- Admin middleware separate from auth middleware; compose both for admin routes

DATA MODEL:
[Describe your entities, their fields, and how they relate]

DOMAIN LOGIC:
[Describe what the app manages, what users can do, what admins can do]

TWO USER TYPES:
- Admin users: stored under admin_users in settings.json, no resource association, full access
- Resource users: stored under users in settings.json, keyed by [resource-specific ID], restricted to own data by default
```

### What to Keep As-Is
- Auth layer (middleware/auth.ts, routes/auth.ts, userService.ts)
- Approval queue pattern (correctionService.ts, pending.json + history.json)
- Infrastructure atomic write helpers
- API client structure (api/client.ts pattern)
- Router auth guard pattern
- useAsyncOp, useToast, useConfirm composables
- Docker + compose layout
- SCSS variable system

### What to Replace
- `domain/models.ts` — define your own entity interfaces
- `domain/[parser|calculator].ts` — replace with your domain logic
- `infrastructure/data.ts` — adapt I/O to your data file format
- `infrastructure/reporter.ts` — replace with your formatting helpers
- `application/[domain]Service.ts` — implement your domain queries
- All pages and components — rebuild for your domain's UI
- `CLAUDE.md` — update the domain description section

---

## 12. Key Patterns Reference

### Atomic JSON Write
```typescript
import { writeFileSync, renameSync } from 'fs'
const tmp = filePath + '.tmp'
writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
renameSync(tmp, filePath)
```

### JWT Issue (login)
```typescript
import { SignJWT } from 'jose'
const secret = new TextEncoder().encode(secretHex)
const token = await new SignJWT({ username, isAdmin, resourceId })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('7d')
  .sign(secret)
setCookie(c, 'session', token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 604800 })
```

### JWT Verify (middleware)
```typescript
import { jwtVerify } from 'jose'
const token = getCookie(c, 'session')
if (!token) return c.json({ error: 'Unauthorized' }, 401)
const { payload } = await jwtVerify(token, secret)
c.set('user', { username: payload.username, isAdmin: payload.isAdmin, resourceId: payload.resourceId ?? null })
```

### Approval Branch
```typescript
function submitChange(payload, submittedBy, isAdmin): boolean {
  if (isAdmin) { recordHistory({ ...payload, appliedBy: submittedBy }); return false }
  queuePending({ ...payload, submittedBy, id: crypto.randomUUID() }); return true
}
// Route:
const pending = submitChange(...)
return c.json({ ok: true, ...(pending && { pending: true }) })
```

### Router Auth Guard (Vue)
```typescript
let cachedConfig: AuthConfig | null = null
router.beforeEach(async (to) => {
  if (!cachedConfig) {
    try { cachedConfig = await api.auth.config() }
    catch (e) { return '/login' }
  }
  if (to.meta.adminOnly && !cachedConfig.is_admin) return '/'
})
```
