import { Hono } from 'hono'
import { listApartments } from '../application/apartmentService.js'
import { listBookings } from '../application/bookingService.js'
import { listCalendarLinks } from '../application/calendarLinkService.js'
import { listChannels } from '../application/channelService.js'
import { listClients } from '../application/clientService.js'
import { listProperties } from '../application/propertyService.js'
import { getSelfProfile, updateSelfProfile, changeSelfPassword } from '../application/userService.js'
import { authMiddleware } from '../middleware/auth.js'
import { findUser } from '../infrastructure/settings.js'
import { issueSessionCookie } from './auth.js'
import { handleError } from './_utils.js'

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

editorRoutes.get('/api/calendar-links', (c) => {
  return c.json(listCalendarLinks())
})

editorRoutes.get('/api/profile', async (c) => {
  try {
    return c.json(await getSelfProfile(c.get('user')))
  } catch (err) { return handleError(err, c) }
})

editorRoutes.patch('/api/profile', async (c) => {
  try {
    const body = await c.req.json<{ full_name?: string; email?: string; username?: string }>()
    const user = c.get('user')
    const result = await updateSelfProfile(user, body)
    // Re-issue session cookie if username changed (JWT payload must stay current)
    if (body.username && body.username !== user.username) {
      const found = findUser(result.username)
      const resourceId = found?.type === 'user' ? found.id : null
      await issueSessionCookie(c, result.username, result.is_admin, resourceId)
    }
    return c.json(result)
  } catch (err) { return handleError(err, c) }
})

editorRoutes.patch('/api/profile/password', async (c) => {
  try {
    const body = await c.req.json<{ current_password?: string; password?: string }>()
    if (!body.current_password || !body.password) {
      return c.json({ error: 'current_password and password are required' }, 400)
    }
    await changeSelfPassword(c.get('user'), { current_password: body.current_password, password: body.password })
    return c.json({ ok: true })
  } catch (err) { return handleError(err, c) }
})

export default editorRoutes
