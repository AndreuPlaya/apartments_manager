import { Hono } from 'hono'
import { listListings } from '../application/listingService.js'
import { listReservations } from '../application/reservationService.js'
import { listCalendarLinks } from '../application/calendarLinkService.js'
import { listChannels } from '../application/channelService.js'
import { listGuests } from '../application/guestService.js'
import { getSelfProfile, updateSelfProfile, changeSelfPassword } from '../application/userService.js'
import { authMiddleware } from '../middleware/auth.js'
import { findUser } from '../infrastructure/settings.js'
import { issueSessionCookie } from './auth.js'
import { handleError } from './_utils.js'

const editorRoutes = new Hono()

editorRoutes.use('/api/*', authMiddleware)

editorRoutes.get('/api/listings', (c) => {
  return c.json(listListings())
})

editorRoutes.get('/api/reservations', (c) => {
  const listingId = c.req.query('listingId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  return c.json(listReservations({ listingId, from, to }))
})

editorRoutes.get('/api/clients', (c) => {
  return c.json(listGuests())
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
