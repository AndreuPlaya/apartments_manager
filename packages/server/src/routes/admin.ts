import { Hono } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import {
  createApartment,
  deleteApartment,
  updateApartment,
} from '../application/apartmentService.js'
import {
  createBooking,
  deleteBooking,
  updateBooking,
} from '../application/bookingService.js'
import {
  deleteCalendarLink,
  upsertCalendarLink,
} from '../application/calendarLinkService.js'
import {
  createChannel,
  deleteChannel,
  updateChannel,
} from '../application/channelService.js'
import {
  createClient,
  deleteClient,
  updateClient,
} from '../application/clientService.js'
import { getMetrics } from '../application/metricsService.js'
import {
  createProperty,
  deleteProperty,
  updateProperty,
} from '../application/propertyService.js'
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../application/userService.js'
import { logAudit } from '../infrastructure/audit.js'
import { adminMiddleware } from '../middleware/admin.js'
import { authMiddleware } from '../middleware/auth.js'
import { handleError } from './_utils.js'
import type {
  CreateApartmentRequest,
  CreateBookingRequest,
  CreateCalendarLinkRequest,
  CreateChannelRequest,
  CreateClientRequest,
  CreatePropertyRequest,
  CreateUserRequest,
  UpdateApartmentRequest,
  UpdateBookingRequest,
  UpdateChannelRequest,
  UpdateClientRequest,
  UpdatePropertyRequest,
  UpdateUserRequest,
} from '../domain/models.js'

const adminRoutes = new Hono()

adminRoutes.use('/api/admin/*', authMiddleware, adminMiddleware)

const writeLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: (c) => c.get('user')?.username ?? 'unknown',
})

// ── Apartments ─────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/apartments', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateApartmentRequest>()
    const result = createApartment(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'apartment', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/apartments/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateApartmentRequest>()
    const result = updateApartment(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'apartment', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/apartments/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteApartment(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'apartment', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Properties ─────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/properties', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreatePropertyRequest>()
    const result = createProperty(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'property', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/properties/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdatePropertyRequest>()
    const result = updateProperty(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'property', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/properties/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteProperty(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'property', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Bookings ───────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/bookings', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateBookingRequest>()
    const result = createBooking(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'booking', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/bookings/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateBookingRequest>()
    const result = updateBooking(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'booking', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/bookings/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteBooking(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'booking', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Clients ────────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/clients', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateClientRequest>()
    const result = createClient(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'client', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/clients/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateClientRequest>()
    const result = updateClient(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'client', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/clients/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteClient(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'client', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Channels ───────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/channels', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateChannelRequest>()
    const result = createChannel(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'channel', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/channels/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateChannelRequest>()
    const result = updateChannel(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'channel', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/channels/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteChannel(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'channel', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Users ──────────────────────────────────────────────────────────────────

adminRoutes.get('/api/admin/users', (c) => {
  return c.json(listUsers())
})

adminRoutes.post('/api/admin/users', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateUserRequest>()
    const result = await createUser(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'user', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/users/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateUserRequest>()
    const result = await updateUser(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'user', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/users/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteUser(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'user', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Calendar Links ─────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/calendar-links', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateCalendarLinkRequest>()
    const result = upsertCalendarLink(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'calendar-link', resourceId: result.id })
    return c.json(result, 200)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/calendar-links/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteCalendarLink(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'calendar-link', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Metrics ────────────────────────────────────────────────────────────────

adminRoutes.get('/api/admin/metrics', (c) => {
  try {
    return c.json(getMetrics())
  } catch (err) { return handleError(err, c) }
})

export default adminRoutes
