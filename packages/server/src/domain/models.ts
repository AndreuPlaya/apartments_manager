/**
 * The reservation lifecycle. Ordered as the stay progresses, terminal states
 * last. See docs/RESERVATION_LIFECYCLE.md for the transition graph, and
 * `domain/reservationStatus.ts` for the rules that read this type.
 */
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

export interface AdminRecord {
  password_hash: string
  full_name: string
  email?: string
  enabled?: boolean
}

export interface UserRecord {
  username: string
  password_hash: string
  full_name: string
  enabled: boolean
  email?: string
}

export interface Settings {
  secret_key: string
  admin_users: Record<string, AdminRecord>
  users: Record<string, UserRecord>
}

export interface SessionUser {
  username: string
  isAdmin: boolean
  resourceId: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  ok: true
  is_admin: boolean
  username: string
}

export interface AuthConfigResponse {
  ok: boolean
  is_admin: boolean
  username: string
}

export type CreateListingRequest = Omit<Listing, 'id'>
export type UpdateListingRequest = Partial<Omit<Listing, 'id'>>

/** Status is absent: every reservation is created `Confirmed` (lifecycle L1). */
export type CreateReservationRequest = Omit<Reservation, 'id' | 'createdAt' | 'status'>
export type UpdateReservationRequest = Partial<Omit<Reservation, 'id' | 'createdAt'>>

export type CreateGuestRequest = Omit<Guest, 'id'>
export type UpdateGuestRequest = Partial<Omit<Guest, 'id'>>

export type CreateChannelRequest = Omit<Channel, 'id'>
export type UpdateChannelRequest = Partial<Omit<Channel, 'id'>>

export type CreateCalendarLinkRequest = Omit<CalendarLink, 'id'>

export interface CreateUserRequest {
  username: string
  password: string
  full_name: string
  isAdmin: boolean
  email?: string
}

export interface UpdateUserRequest {
  username?: string
  password?: string
  full_name?: string
  enabled?: boolean
  email?: string
  /** Moves the account between the two buckets — see `writeAccount`. */
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
  /** The channels' cut of `revenue`. Derived, never stored. */
  commission: number
  /** `revenue - commission` — what the portfolio actually keeps. */
  netRevenue: number
  /** Gross, year to date. Restarts each January. */
  cumulativeRevenue: number
}

export interface MetricsResponse {
  occupancy: MonthlyOccupancy[]
  revenue: MonthlyRevenue[]
}

export interface ReservationFilters {
  listingId?: string
  from?: string
  to?: string
}
