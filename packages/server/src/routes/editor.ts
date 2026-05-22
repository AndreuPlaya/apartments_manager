import { Hono } from 'hono'
import { listApartments } from '../application/apartmentService.js'
import { listBookings, patchBookingFields } from '../application/bookingService.js'
import { listChannels } from '../application/channelService.js'
import { listClients } from '../application/clientService.js'
import { listProperties } from '../application/propertyService.js'
import { authMiddleware } from '../middleware/auth.js'
import { AppError } from '../application/errors.js'
import type { Context } from 'hono'

function handleError(err: unknown, c: Context) {
  if (err instanceof AppError) return c.json({ error: err.message }, err.statusCode as any)
  throw err
}

const editorRoutes = new Hono()

editorRoutes.use('/api/*', authMiddleware)

editorRoutes.get('/api/apartments', (c) => {
  return c.json(listApartments())
})

editorRoutes.get('/api/properties', (c) => {
  return c.json(listProperties())
})

editorRoutes.get('/api/bookings', (c) => {
  const apartmentId = c.req.query('apartmentId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  return c.json(listBookings({ apartmentId, from, to }))
})

editorRoutes.get('/api/clients', (c) => {
  return c.json(listClients())
})

editorRoutes.get('/api/channels', (c) => {
  return c.json(listChannels())
})

editorRoutes.patch('/api/bookings/:id', async (c) => {
  try {
    const body = await c.req.json<{ comment?: string; status?: string }>()
    const { comment, status } = body
    return c.json(patchBookingFields(c.req.param('id'), { comment, status: status as any }))
  } catch (err) { return handleError(err, c) }
})

export default editorRoutes
