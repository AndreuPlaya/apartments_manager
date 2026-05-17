#!/usr/bin/env node
/**
 * Migrates a MongoDB JSON dump into the application database format.
 *
 * Dumps are stored as subdirectories under data/mongodb/, each containing
 * NDJSON files produced by bsondump (one JSON object per line).
 *
 * Usage:
 *   node scripts/migrate-dump.mjs              # interactive selection
 *   node scripts/migrate-dump.mjs <dump-name>  # direct selection
 *   node scripts/migrate-dump.mjs --list       # list available dumps
 */

import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DUMPS_DIR = join(ROOT, 'data', 'mongodb')
const DB_DIR = join(ROOT, 'data', 'database')
const SETTINGS_PATH = join(ROOT, 'data', 'config', 'settings.json')

// ── Helpers ───────────────────────────────────────────────────────────────

function readNdjson(filePath) {
  if (!existsSync(filePath)) return []
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l))
}

function oid(v) { return v?.['$oid'] ?? v }

function num(v) {
  if (v === undefined || v === null) return undefined
  if (typeof v === 'number') return v
  if (v['$numberInt'] !== undefined) return parseInt(v['$numberInt'], 10)
  if (v['$numberDouble'] !== undefined) return parseFloat(v['$numberDouble'])
  return Number(v)
}

function dateStr(v) {
  if (!v) return undefined
  const ms = v['$date']?.['$numberLong']
  if (ms !== undefined) return new Date(parseInt(ms, 10)).toISOString().slice(0, 10)
  if (typeof v === 'string') return v.slice(0, 10)
  return undefined
}

function isoStr(v) {
  if (!v) return undefined
  const ms = v['$date']?.['$numberLong']
  if (ms !== undefined) return new Date(parseInt(ms, 10)).toISOString()
  if (typeof v === 'string') return v
  return undefined
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// ── Transformers ──────────────────────────────────────────────────────────

function transformApartments(rows) {
  return rows.map(a => ({
    id: oid(a._id),
    name: a.name,
    address: a.address?.trim(),
    floor: num(a.floor),
    door: a.door,
    price: num(a.price),
    minNights: num(a.minNights) ?? 1,
    maxGuests: num(a.maxGuests),
    rooms: num(a.rooms),
    bathrooms: num(a.bathrooms),
    isAvailable: a.isAvailable ?? true,
    ...(a.description ? { description: a.description } : {}),
  }))
}

function transformChannels(rows) {
  return rows.map(c => ({
    id: oid(c._id),
    name: c.name,
    commissionRate: num(c.commissionRate) ?? 0,
    isActive: true,
  }))
}

function transformClients(rows) {
  return rows.map(c => ({
    id: oid(c._id),
    name: c.name,
    ...(c.identityDocument ? { identityDocument: c.identityDocument } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(c.phoneNumber ? { phoneNumber: c.phoneNumber } : {}),
    ...(c.street ? { street: c.street } : {}),
    ...(c.city ? { city: c.city } : {}),
    ...(c.country ? { country: c.country } : {}),
    ...(c.zipCode ? { zipCode: c.zipCode } : {}),
    ...(c.comment ? { comment: c.comment } : {}),
  }))
}

function transformBookings(rows) {
  return rows.map(b => ({
    id: oid(b._id),
    apartmentId: oid(b.apartment),
    clientId: oid(b.client),
    channelId: oid(b.channel),
    fromDate: dateStr(b.fromDate),
    toDate: dateStr(b.toDate),
    adultCount: num(b.adultCount) ?? 1,
    childrenCount: num(b.childrenCount) ?? 0,
    status: b.status ?? 'NotPaid',
    totalAmountDue: num(b.totalAmmountDue) ?? num(b.totalAmountDue) ?? 0,
    createdAt: isoStr(b.createdAt) ?? new Date().toISOString(),
    ...(b.comment ? { comment: b.comment } : {}),
  }))
}

function transformProperties(rows) {
  return rows.map(p => {
    const floorVal = typeof p.floor === 'object' && p.floor?.['$numberInt'] !== undefined
      ? String(num(p.floor))
      : (p.floor != null ? String(p.floor) : undefined)
    return {
      id: oid(p._id),
      name: p.name,
      address: p.address?.trim(),
      ...(p.city ? { city: p.city } : {}),
      ...(floorVal ? { floor: floorVal } : {}),
      ...(p.door !== undefined && p.door !== '' ? { door: p.door } : {}),
      rentalType: p.rentalType ?? 'short-term',
      isAvailable: p.isAvailable ?? true,
      ...(p.comment ? { comment: p.comment } : {}),
    }
  })
}

function migrateUsers(rows) {
  if (!existsSync(SETTINGS_PATH)) {
    console.warn('  (!) settings.json not found — skipping user migration')
    return
  }
  const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'))

  for (const u of rows) {
    const isAdmin = Array.isArray(u.roles) && u.roles.includes('Admin')
    const username = u.username.toLowerCase()
    if (isAdmin) {
      settings.admin_users[username] = { password_hash: u.password, full_name: u.username }
    } else {
      settings.users[username] = {
        username,
        password_hash: u.password,
        full_name: u.username,
        enabled: u.active ?? true,
      }
    }
  }

  try {
    writeJson(SETTINGS_PATH, settings)
  } catch {
    console.warn(`  (!) Cannot write settings.json (permission denied).`)
    console.warn(`      Run: sudo chown $USER data/config/settings.json`)
    console.warn(`      Then re-run the migration to sync users.`)
  }
  return rows
}

// ── Dump discovery ────────────────────────────────────────────────────────

function listDumps() {
  if (!existsSync(DUMPS_DIR)) return []
  return readdirSync(DUMPS_DIR)
    .filter(name => statSync(join(DUMPS_DIR, name)).isDirectory())
    .sort()
    .reverse() // newest first (if using dated names)
}

// ── Interactive selection ─────────────────────────────────────────────────

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()) }))
}

async function selectDump(dumps) {
  console.log('\nAvailable dumps:\n')
  dumps.forEach((name, i) => console.log(`  [${i + 1}] ${name}`))
  console.log()

  const answer = await ask(`Select dump (1-${dumps.length}): `)
  const idx = parseInt(answer, 10) - 1
  if (isNaN(idx) || idx < 0 || idx >= dumps.length) {
    console.error('Invalid selection.')
    process.exit(1)
  }
  return dumps[idx]
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2]

  if (arg === '--list') {
    const dumps = listDumps()
    if (dumps.length === 0) {
      console.log(`No dumps found in data/mongodb/`)
    } else {
      console.log(`Dumps in data/mongodb/:\n`)
      dumps.forEach(name => console.log(`  ${name}`))
    }
    return
  }

  const dumps = listDumps()
  if (dumps.length === 0) {
    console.error(`No dumps found in ${DUMPS_DIR}`)
    console.error(`Place dump directories under data/mongodb/<dump-name>/`)
    process.exit(1)
  }

  let dumpName
  if (arg) {
    if (!dumps.includes(arg)) {
      console.error(`Dump "${arg}" not found. Available: ${dumps.join(', ')}`)
      process.exit(1)
    }
    dumpName = arg
  } else {
    dumpName = dumps.length === 1 ? dumps[0] : await selectDump(dumps)
  }

  const dumpDir = join(DUMPS_DIR, dumpName)
  console.log(`\nMigrating dump: ${dumpName}\n`)

  const file = name => join(dumpDir, `${name}.json`)

  const apartments = transformApartments(readNdjson(file('apartments')))
  const channels   = transformChannels(readNdjson(file('channels')))
  const clients    = transformClients(readNdjson(file('clients')))
  const bookings   = transformBookings(readNdjson(file('bookings')))
  const properties = transformProperties(readNdjson(file('properties')))
  const users      = readNdjson(file('users'))

  // Confirm before wiping database
  if (process.stdout.isTTY) {
    const confirm = await ask(
      `This will replace all data in data/database/. Continue? [y/N] `
    )
    if (confirm.toLowerCase() !== 'y') {
      console.log('Aborted.')
      return
    }
  }

  // Clear and recreate database directory
  if (existsSync(DB_DIR)) rmSync(DB_DIR, { recursive: true })
  mkdirSync(DB_DIR, { recursive: true })

  // Write data files
  writeJson(join(DB_DIR, 'apartments.json'), apartments)
  writeJson(join(DB_DIR, 'channels.json'), channels)
  writeJson(join(DB_DIR, 'clients.json'), clients)
  writeJson(join(DB_DIR, 'bookings.json'), bookings)
  writeJson(join(DB_DIR, 'properties.json'), properties)

  // Migrate users into settings.json
  migrateUsers(users)

  console.log(`  apartments : ${apartments.length}`)
  console.log(`  channels   : ${channels.length}`)
  console.log(`  clients    : ${clients.length}`)
  console.log(`  bookings   : ${bookings.length}`)
  console.log(`  properties : ${properties.length}`)
  console.log(`  users      : ${users.length}`)
  console.log(`\nDone. Database replaced from dump "${dumpName}".`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
