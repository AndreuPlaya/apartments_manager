import { join } from 'node:path'

export const DATA_DIR: string = process.env['DATA_DIR'] ?? process.cwd()

export const PATHS = {
  settingsJson: join(DATA_DIR, 'config', 'settings.json'),
  auditLogJsonl: join(DATA_DIR, 'config', 'audit.jsonl'),
  dbFile: join(DATA_DIR, 'database', 'app.db'),
  apartmentsJson: join(DATA_DIR, 'database', 'apartments.json'),
  bookingsJson: join(DATA_DIR, 'database', 'bookings.json'),
  clientsJson: join(DATA_DIR, 'database', 'clients.json'),
  channelsJson: join(DATA_DIR, 'database', 'channels.json'),
  calendarLinksJson: join(DATA_DIR, 'database', 'calendarLinks.json'),
}
