import { Hono } from 'hono'
import { listApartments } from '../application/apartmentService.js'
import { listBookings } from '../application/bookingService.js'
import { listChannels } from '../application/channelService.js'
import { listClients } from '../application/clientService.js'
import { listProperties } from '../application/propertyService.js'
import { authMiddleware } from '../middleware/auth.js'

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

export default editorRoutes
