/** docs/RESERVATION_LIFECYCLE.md — ordered as the stay progresses. */
export type ReservationStatus =
  | 'Confirmed'
  | 'CheckedIn'
  | 'CheckedOut'
  | 'Cancelled'
  | 'NoShow'

export interface Listing {
  id: string
  name: string
  address: string
  floor: number
  door: string
  nightlyRate: number
  minNights: number
  maxAdults: number
  rooms: number
  bathrooms: number
  isActive: boolean
  description?: string
}

export interface Reservation {
  id: string
  listingId: string
  guestId: string
  channelId: string
  checkIn: string
  checkOut: string
  adultCount: number
  childrenCount: number
  cribRequested?: boolean
  status: ReservationStatus
  paidDate?: string
  totalAmountDue: number
  comment?: string
  createdAt: string
}

export interface Guest {
  id: string
  identityDocument?: string
  name: string
  email?: string
  phoneNumber?: string
  street?: string
  city?: string
  country?: string
  zipCode?: string
  comment?: string
}

export interface Channel {
  id: string
  name: string
  commissionRate: number
  isActive: boolean
}

export interface CalendarLink {
  id: string
  channelId: string
  listingId: string
  url: string
}

export interface UserItem {
  id: string
  username: string
  full_name: string
  /** Absent until somebody fills it in; the address a second factor will use. */
  email?: string
  isAdmin: boolean
  enabled: boolean
}

/**
 * What one edit of a user account can change. `isAdmin` moves the account
 * between the server's two buckets, so the reply carries a *different* `id` —
 * see `UsersTab.updateField`.
 */
export interface UserPatch {
  username?: string
  password?: string
  full_name?: string
  email?: string
  enabled?: boolean
  isAdmin?: boolean
}

export interface MonthlyOccupancy {
  year: number
  month: number
  occupancyRate: number
  bookedNights: number
  totalNights: number
}

export interface MonthlyRevenue {
  year: number
  month: number
  /** Gross amount owed, channel commission included. */
  revenue: number
  /** The channels' cut of `revenue`. Derived server-side, never stored. */
  commission: number
  /** `revenue - commission`. */
  netRevenue: number
  cumulativeRevenue: number
}

export interface MetricsData {
  occupancy: MonthlyOccupancy[]
  revenue: MonthlyRevenue[]
}

export interface ProfileData {
  username: string
  full_name: string
  email: string | undefined
  is_admin: boolean
}

export type AuthConfig =
  | { ok: true; is_admin: boolean; username: string }
  | { ok: false }

// ── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

/**
 * This bundle asked for an endpoint the server does not have — so this bundle
 * is older than the server it is talking to. A tab left open across a deploy
 * that renamed a route keeps running its loaded code, and the shell being
 * `no-store` (routes/spa.ts) only helps once someone reloads.
 *
 * Told apart from an ordinary 404 (a record that does not exist) by the message
 * the unknown-endpoint handler sends, so the UI can say "reload" instead of
 * reporting a data error the user cannot act on.
 */
export class StaleClientError extends ApiError {
  constructor(public readonly endpoint: string) {
    super(404, `Unknown API endpoint: ${endpoint}`)
  }
}

const UNKNOWN_ENDPOINT = 'Unknown API endpoint: '

/**
 * The session is gone — expired, or signed with a secret this server no longer
 * has. Distinct from a rejected login, which is also a 401 but means the
 * password was wrong.
 */
export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, 'Session expired')
  }
}

let onSessionExpired: (() => void) | null = null

/**
 * Installed by the router. Without it a dead session showed up as a toast
 * saying "Unauthorized" over a page rendering zeros — a Today screen claiming
 * no arrivals when it simply was not allowed to ask. Zeros are a statement;
 * this makes the app go back to the login screen instead of making it.
 */
export function setSessionExpiredHandler(fn: (() => void) | null): void {
  onSessionExpired = fn
}

// ── Base fetch ───────────────────────────────────────────────────────────────

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    let msg = text
    try { msg = JSON.parse(text).error ?? text } catch { /* keep raw */ }
    if (res.status === 404 && msg.startsWith(UNKNOWN_ENDPOINT)) {
      throw new StaleClientError(msg.slice(UNKNOWN_ENDPOINT.length))
    }
    // `/api/auth/*` is excluded on purpose: a refused login is a 401 too, and
    // it means "wrong password", not "your session died".
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      onSessionExpired?.()
      throw new SessionExpiredError()
    }
    throw new ApiError(res.status, msg)
  }
  const ct = res.headers.get('content-type') ?? ''
  return ct.includes('application/json') ? res.json() : (undefined as unknown as T)
}

function json<T>(path: string, method: string, body: unknown): Promise<T> {
  return request<T>(path, { method, headers: JSON_HEADERS, body: JSON.stringify(body) })
}

// ── API object ────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    config: async (): Promise<AuthConfig> => {
      const res = await fetch('/api/auth/config', { credentials: 'same-origin' })
      return res.json()
    },
    login: (body: { username: string; password: string }) =>
      json<{ ok: true; is_admin: boolean; username: string }>('/api/auth/login', 'POST', body),
    logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
    setup: (body: { username: string; password: string; full_name: string }) =>
      json<{ ok: true }>('/api/auth/setup', 'POST', body),
    /**
     * Whether the server has no admin yet. Told apart from "not logged in" by
     * the status: the first-run guard answers 503 on every non-auth route until
     * an admin exists. Raw fetch, so an anonymous 401 here is an answer rather
     * than a dead session.
     */
    setupRequired: async (): Promise<boolean> => {
      const res = await fetch('/api/listings', { credentials: 'same-origin' })
      return res.status === 503
    },
  },

  listings: {
    list: () => request<Listing[]>('/api/listings'),
    create: (body: Omit<Listing, 'id'>) =>
      json<Listing>('/api/admin/listings', 'POST', body),
    update: (id: string, body: Partial<Omit<Listing, 'id'>>) =>
      json<Listing>(`/api/admin/listings/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/listings/${id}`, { method: 'DELETE' }),
  },

  reservations: {
    list: (params?: { listingId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams()
      if (params?.listingId) q.set('listingId', params.listingId)
      if (params?.from) q.set('from', params.from)
      if (params?.to) q.set('to', params.to)
      const qs = q.toString()
      return request<Reservation[]>(`/api/reservations${qs ? '?' + qs : ''}`)
    },
    // Status is absent: every reservation is created Confirmed (lifecycle L1).
    create: (body: Omit<Reservation, 'id' | 'createdAt' | 'status'>) =>
      json<Reservation>('/api/admin/reservations', 'POST', body),
    // `override` lifts the lifecycle graph. Admin-only, and never the default —
    // an ordinary edit must still be refused for an illegal transition (L4).
    update: (
      id: string,
      body: Partial<Omit<Reservation, 'id' | 'createdAt'>>,
      opts?: { override?: boolean },
    ) =>
      json<Reservation>(
        `/api/admin/reservations/${id}${opts?.override ? '?override=true' : ''}`,
        'PATCH',
        body,
      ),
    patch: (id: string, body: { comment?: string; status?: ReservationStatus; paidDate?: string }) =>
      json<Reservation>(`/api/admin/reservations/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/reservations/${id}`, { method: 'DELETE' }),
  },

  guests: {
    list: () => request<Guest[]>('/api/guests'),
    create: (body: Omit<Guest, 'id'>) =>
      json<Guest>('/api/admin/guests', 'POST', body),
    update: (id: string, body: Partial<Omit<Guest, 'id'>>) =>
      json<Guest>(`/api/admin/guests/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/guests/${id}`, { method: 'DELETE' }),
  },

  channels: {
    list: () => request<Channel[]>('/api/channels'),
    create: (body: Omit<Channel, 'id'>) =>
      json<Channel>('/api/admin/channels', 'POST', body),
    update: (id: string, body: Partial<Omit<Channel, 'id'>>) =>
      json<Channel>(`/api/admin/channels/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/channels/${id}`, { method: 'DELETE' }),
  },

  calendarLinks: {
    list: () => request<CalendarLink[]>('/api/calendar-links'),
    upsert: (body: Omit<CalendarLink, 'id'>) =>
      json<CalendarLink>('/api/admin/calendar-links', 'POST', body),
    delete: (id: string) =>
      request<void>(`/api/admin/calendar-links/${id}`, { method: 'DELETE' }),
  },

  users: {
    list: () => request<UserItem[]>('/api/admin/users'),
    create: (body: { username: string; password: string; full_name: string; isAdmin: boolean; email?: string }) =>
      json<UserItem>('/api/admin/users', 'POST', body),
    update: (id: string, body: UserPatch) => json<UserItem>(`/api/admin/users/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  },

  metrics: {
    get: () => request<MetricsData>('/api/admin/metrics'),
  },

  profile: {
    get: () => request<ProfileData>('/api/profile'),
    update: (body: { full_name?: string; email?: string; username?: string }) =>
      json<ProfileData>('/api/profile', 'PATCH', body),
    changePassword: (body: { current_password: string; password: string }) =>
      json<{ ok: true }>('/api/profile/password', 'PATCH', body),
  },
}
