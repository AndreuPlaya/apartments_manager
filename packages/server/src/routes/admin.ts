import { Hono } from 'hono'
import type { Context } from 'hono'
import { AppError } from '../application/errors.js'
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
import { adminMiddleware } from '../middleware/admin.js'
import { authMiddleware } from '../middleware/auth.js'
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

function handleError(err: unknown, c: Context) {
  if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any)
  throw err
}

// ── Apartments ─────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/apartments', async (c) => {
  try {
    const body = await c.req.json<CreateApartmentRequest>()
    return c.json(createApartment(body), 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/apartments/:id', async (c) => {
  try {
    const body = await c.req.json<UpdateApartmentRequest>()
    return c.json(updateApartment(c.req.param('id'), body))
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/apartments/:id', (c) => {
  try {
    deleteApartment(c.req.param('id'))
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Properties ─────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/properties', async (c) => {
  try {
    const body = await c.req.json<CreatePropertyRequest>()
    return c.json(createProperty(body), 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/properties/:id', async (c) => {
  try {
    const body = await c.req.json<UpdatePropertyRequest>()
    return c.json(updateProperty(c.req.param('id'), body))
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/properties/:id', (c) => {
  try {
    deleteProperty(c.req.param('id'))
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Bookings ───────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/bookings', async (c) => {
  try {
    const body = await c.req.json<CreateBookingRequest>()
    return c.json(createBooking(body), 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/bookings/:id', async (c) => {
  try {
    const body = await c.req.json<UpdateBookingRequest>()
    return c.json(updateBooking(c.req.param('id'), body))
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/bookings/:id', (c) => {
  try {
    deleteBooking(c.req.param('id'))
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Clients ────────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/clients', async (c) => {
  try {
    const body = await c.req.json<CreateClientRequest>()
    return c.json(createClient(body), 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/clients/:id', async (c) => {
  try {
    const body = await c.req.json<UpdateClientRequest>()
    return c.json(updateClient(c.req.param('id'), body))
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/clients/:id', (c) => {
  try {
    deleteClient(c.req.param('id'))
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Channels ───────────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/channels', async (c) => {
  try {
    const body = await c.req.json<CreateChannelRequest>()
    return c.json(createChannel(body), 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/channels/:id', async (c) => {
  try {
    const body = await c.req.json<UpdateChannelRequest>()
    return c.json(updateChannel(c.req.param('id'), body))
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/channels/:id', (c) => {
  try {
    deleteChannel(c.req.param('id'))
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Users ──────────────────────────────────────────────────────────────────

adminRoutes.get('/api/admin/users', (c) => {
  return c.json(listUsers())
})

adminRoutes.post('/api/admin/users', async (c) => {
  try {
    const body = await c.req.json<CreateUserRequest>()
    return c.json(await createUser(body), 201)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.patch('/api/admin/users/:id', async (c) => {
  try {
    const body = await c.req.json<UpdateUserRequest>()
    return c.json(await updateUser(c.req.param('id'), body))
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/users/:id', (c) => {
  try {
    deleteUser(c.req.param('id'))
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

// ── Calendar Links ─────────────────────────────────────────────────────────

adminRoutes.post('/api/admin/calendar-links', async (c) => {
  try {
    const body = await c.req.json<CreateCalendarLinkRequest>()
    return c.json(upsertCalendarLink(body), 200)
  } catch (err) { return handleError(err, c) }
})

adminRoutes.delete('/api/admin/calendar-links/:id', (c) => {
  try {
    deleteCalendarLink(c.req.param('id'))
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
