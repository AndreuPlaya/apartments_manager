import { join } from 'node:path'

export const DATA_DIR: string = process.env['DATA_DIR'] ?? process.cwd()

export const PATHS = {
  settingsJson: join(DATA_DIR, 'config', 'settings.json'),
  apartmentsJson: join(DATA_DIR, 'database', 'apartments.json'),
  propertiesJson: join(DATA_DIR, 'database', 'properties.json'),
  bookingsJson: join(DATA_DIR, 'database', 'bookings.json'),
  clientsJson: join(DATA_DIR, 'database', 'clients.json'),
  channelsJson: join(DATA_DIR, 'database', 'channels.json'),
}
