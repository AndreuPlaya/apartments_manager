export type BookingStatus = 'Active' | 'Cancelled'

export interface Apartment {
  id: string
  name: string
  address: string
  floor: number
  door: string
  price: number
  minNights: number
  maxGuests: number
  rooms: number
  bathrooms: number
  isAvailable: boolean
  description?: string
}

export interface Booking {
  id: string
  apartmentId: string
  clientId: string
  channelId: string
  fromDate: string
  toDate: string
  adultCount: number
  childrenCount: number
  cribRequested?: boolean
  status: BookingStatus
  paidDate?: string
  totalAmountDue: number
  comment?: string
  createdAt: string
}

export interface Client {
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
  apartmentId: string
  url: string
}

export interface UserItem {
  id: string
  username: string
  full_name: string
  isAdmin: boolean
  enabled: boolean
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
  revenue: number
  cumulativeRevenue: number
}

export interface MetricsData {
  occupancy: MonthlyOccupancy[]
  revenue: MonthlyRevenue[]
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

// ── Base fetch ───────────────────────────────────────────────────────────────

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    let msg = text
    try { msg = JSON.parse(text).error ?? text } catch { /* keep raw */ }
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
  },

  apartments: {
    list: () => request<Apartment[]>('/api/apartments'),
    create: (body: Omit<Apartment, 'id'>) =>
      json<Apartment>('/api/admin/apartments', 'POST', body),
    update: (id: string, body: Partial<Omit<Apartment, 'id'>>) =>
      json<Apartment>(`/api/admin/apartments/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/apartments/${id}`, { method: 'DELETE' }),
  },

  bookings: {
    list: (params?: { apartmentId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams()
      if (params?.apartmentId) q.set('apartmentId', params.apartmentId)
      if (params?.from) q.set('from', params.from)
      if (params?.to) q.set('to', params.to)
      const qs = q.toString()
      return request<Booking[]>(`/api/bookings${qs ? '?' + qs : ''}`)
    },
    create: (body: Omit<Booking, 'id' | 'createdAt'>) =>
      json<Booking>('/api/admin/bookings', 'POST', body),
    update: (id: string, body: Partial<Omit<Booking, 'id' | 'createdAt'>>) =>
      json<Booking>(`/api/admin/bookings/${id}`, 'PATCH', body),
    patch: (id: string, body: { comment?: string; status?: BookingStatus; paidDate?: string }) =>
      json<Booking>(`/api/bookings/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/bookings/${id}`, { method: 'DELETE' }),
  },

  clients: {
    list: () => request<Client[]>('/api/clients'),
    create: (body: Omit<Client, 'id'>) =>
      json<Client>('/api/admin/clients', 'POST', body),
    update: (id: string, body: Partial<Omit<Client, 'id'>>) =>
      json<Client>(`/api/admin/clients/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/clients/${id}`, { method: 'DELETE' }),
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
    create: (body: { username: string; password: string; full_name: string; isAdmin: boolean }) =>
      json<UserItem>('/api/admin/users', 'POST', body),
    update: (id: string, body: { username?: string; password?: string; full_name?: string; enabled?: boolean }) =>
      json<UserItem>(`/api/admin/users/${id}`, 'PATCH', body),
    delete: (id: string) => request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  },

  metrics: {
    get: () => request<MetricsData>('/api/admin/metrics'),
  },
}
