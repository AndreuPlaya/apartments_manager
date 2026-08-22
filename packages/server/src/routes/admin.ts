import { Hono } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import {
  createListing,
  deleteListing,
  updateListing,
} from '../application/listingService.js'
import {
  createReservation,
  deleteReservation,
  updateReservation,
} from '../application/reservationService.js'
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
  createGuest,
  deleteGuest,
  updateGuest,
} from '../application/guestService.js'
import { getMetrics } from '../application/metricsService.js'
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
  CreateListingRequest,
  CreateReservationRequest,
  CreateCalendarLinkRequest,
  CreateChannelRequest,
  CreateGuestRequest,
  CreateUserRequest,
  UpdateListingRequest,
  UpdateReservationRequest,
  UpdateChannelRequest,
  UpdateGuestRequest,
  UpdateUserRequest,
} from '../domain/models.js'

const adminRoutes = new Hono()

adminRoutes.use('/api/admin/*', authMiddleware, adminMiddleware)

const writeLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  // The limiter always runs behind authMiddleware, which either sets the user
  // or returns 401, so the fallback key is defensive only.
  /* c8 ignore next */
  keyGenerator: (c) => c.get('user')?.username ?? 'unknown',
})

// ── Listings ─────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/listings', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateListingRequest>()
    const result = createListing(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'listing', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/listings/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateListingRequest>()
    const result = updateListing(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'listing', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/listings/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteListing(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'listing', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Reservations ───────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/reservations', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateReservationRequest>()
    const result = createReservation(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'reservation', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

// `?override=true` lifts the lifecycle graph (docs/RESERVATION_LIFECYCLE.md L4).
// It is opt-in rather than implied by being an admin, so the ordinary edit still
// gets refused for an illegal transition, and the override is audited apart.
adminRoutes.patch('/api/admin/reservations/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const override = c.req.query('override') === 'true'
    const body = await c.req.json<UpdateReservationRequest>()
    const result = updateReservation(id, body, { override })
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: override ? 'override' : 'update', resource: 'reservation', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/reservations/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteReservation(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'reservation', resourceId: id })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Guests ────────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/guests', writeLimiter, async (c) => {
  try {
    const body = await c.req.json<CreateGuestRequest>()
    const result = createGuest(body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'create', resource: 'guest', resourceId: result.id })
    return c.json(result, 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/guests/:id', writeLimiter, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateGuestRequest>()
    const result = updateGuest(id, body)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'update', resource: 'guest', resourceId: id })
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/guests/:id', writeLimiter, (c) => {
  try {
    const id = c.req.param('id')
    deleteGuest(id)
    logAudit({ timestamp: new Date().toISOString(), username: c.get('user').username, isAdmin: true, action: 'delete', resource: 'guest', resourceId: id })
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
