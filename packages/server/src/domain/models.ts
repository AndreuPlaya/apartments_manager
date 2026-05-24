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

export interface Property {
  id: string
  name: string
  address: string
  city?: string
  floor?: string
  door?: string
  rentalType: 'short-term' | 'long-term' | 'room'
  isAvailable: boolean
  comment?: string
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

export interface AdminRecord {
  password_hash: string
  full_name: string
}

export interface UserRecord {
  username: string
  password_hash: string
  full_name: string
  enabled: boolean
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

export type CreateApartmentRequest = Omit<Apartment, 'id'>
export type UpdateApartmentRequest = Partial<Omit<Apartment, 'id'>>

export type CreatePropertyRequest = Omit<Property, 'id'>
export type UpdatePropertyRequest = Partial<Omit<Property, 'id'>>

export type CreateBookingRequest = Omit<Booking, 'id' | 'createdAt'>
export type UpdateBookingRequest = Partial<Omit<Booking, 'id' | 'createdAt'>>

export type CreateClientRequest = Omit<Client, 'id'>
export type UpdateClientRequest = Partial<Omit<Client, 'id'>>

export type CreateChannelRequest = Omit<Channel, 'id'>
export type UpdateChannelRequest = Partial<Omit<Channel, 'id'>>

export type CreateCalendarLinkRequest = Omit<CalendarLink, 'id'>

export interface CreateUserRequest {
  username: string
  password: string
  full_name: string
  isAdmin: boolean
}

export interface UpdateUserRequest {
  username?: string
  password?: string
  full_name?: string
  enabled?: boolean
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

export interface MetricsResponse {
  occupancy: MonthlyOccupancy[]
  revenue: MonthlyRevenue[]
}

export interface BookingFilters {
  apartmentId?: string
  from?: string
  to?: string
}
