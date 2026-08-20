#!/usr/bin/env node
/**
 * Converts a `mongoexport --jsonArray` dump of the legacy IXAGrupDB into the
 * JSON files this application imports on first boot.
 *
 *   mongoexport --uri="$MONGO_URI" --collection=bookings --jsonArray --out=dump/bookings.json
 *   node scripts/mongo-to-json.mjs <dump-dir> <out-dir>
 *
 * Then point the server at a DATA_DIR whose `database/` holds <out-dir>'s files;
 * it imports them into SQLite on boot and renames them to *.json.migrated.
 *
 * The conversion is deliberately conservative: it renames and reshapes, and
 * reports anything it drops or merges. It never invents a booking or a client.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [dumpDir, outDir] = process.argv.slice(2)
if (!dumpDir || !outDir) {
  console.error('usage: node scripts/mongo-to-json.mjs <dump-dir> <out-dir>')
  process.exit(1)
}

const read = (name) => JSON.parse(readFileSync(join(dumpDir, `${name}.json`), 'utf8'))

/** Mongo extended JSON: { $oid } for ids, { $date } for dates. */
const oid = (v) => (v && typeof v === 'object' && '$oid' in v ? v.$oid : v)
const date = (v) => (v && typeof v === 'object' && '$date' in v ? v.$date : v)

/** Stays are stored as plain calendar days; the time part is noise. */
const day = (v) => String(date(v) ?? '').slice(0, 10)
const iso = (v) => new Date(date(v)).toISOString()

/** Blank means "not provided": empty strings would collide on the unique indexes. */
const text = (v) => {
  if (v === undefined || v === null) return undefined
  const t = String(v).trim()
  return t === '' ? undefined : t
}

const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

const notes = []
const note = (msg) => notes.push(msg)

// ── Apartments ──────────────────────────────────────────────────────────────

const apartments = read('apartments').map((a) => ({
  id: oid(a._id),
  name: text(a.name) ?? '(unnamed)',
  address: text(a.address) ?? '',
  floor: num(a.floor, 0),
  door: text(a.door) ?? '',
  price: num(a.price, 0),
  minNights: num(a.minNights, 1),
  maxGuests: num(a.maxGuests, 1),
  rooms: num(a.rooms, 1),
  bathrooms: num(a.bathrooms, 1),
  isAvailable: a.isAvailable !== false,
  description: text(a.description),
}))

// ── Properties ──────────────────────────────────────────────────────────────

const RENTAL_TYPES = new Set(['short-term', 'long-term', 'room'])
const properties = read('properties').map((p) => {
  const rentalType = RENTAL_TYPES.has(p.rentalType) ? p.rentalType : 'long-term'
  if (rentalType !== p.rentalType) {
    note(`property ${oid(p._id)}: rentalType ${JSON.stringify(p.rentalType)} -> 'long-term'`)
  }
  return {
    id: oid(p._id),
    name: text(p.name) ?? '(unnamed)',
    address: text(p.address) ?? '',
    city: text(p.city),
    // Property floors are free text ("bajo", "ático"); apartments use a number.
    floor: text(p.floor),
    door: text(p.door),
    rentalType,
    isAvailable: p.isAvailable !== false,
    comment: text(p.comment),
  }
})

// ── Channels ────────────────────────────────────────────────────────────────

const channels = read('channels').map((c) => {
  if (c.isActive === undefined) note(`channel '${c.name}': no isActive field, defaulted to active`)
  return {
    id: oid(c._id),
    name: text(c.name) ?? '(unnamed)',
    commissionRate: num(c.commissionRate, 0),
    isActive: c.isActive !== false,
  }
})

// ── Clients (deduplicated) ──────────────────────────────────────────────────

const rawClients = read('clients').map((c) => ({
  id: oid(c._id),
  identityDocument: text(c.identityDocument),
  name: text(c.name) ?? '(unnamed)',
  email: text(c.email),
  phoneNumber: text(c.phoneNumber),
  street: text(c.street),
  city: text(c.city),
  country: text(c.country),
  zipCode: text(c.zipCode),
  comment: text(c.comment),
}))

/**
 * Two client records that share an email or an identity document are the same
 * person entered twice; the schema enforces that. Keep the most complete record
 * and remember the mapping so bookings can be repointed.
 */
const completeness = (c) => Object.values(c).filter((v) => v !== undefined).length
const clientIdMap = new Map()
const clients = []
const byEmail = new Map()
const byDocument = new Map()

for (const c of rawClients) {
  const emailKey = c.email?.toLowerCase()
  const docKey = c.identityDocument?.toUpperCase()
  const existing =
    (emailKey && byEmail.get(emailKey)) || (docKey && byDocument.get(docKey)) || undefined

  if (existing === undefined) {
    clients.push(c)
    if (emailKey) byEmail.set(emailKey, c)
    if (docKey) byDocument.set(docKey, c)
    continue
  }

  // Merge: keep whichever record carries more fields, fill gaps from the other.
  const [keep, drop] = completeness(c) > completeness(existing) ? [c, existing] : [existing, c]
  for (const [k, v] of Object.entries(drop)) if (keep[k] === undefined && k !== 'id') keep[k] = v
  if (keep !== existing) clients.splice(clients.indexOf(existing), 1, keep)

  clientIdMap.set(drop.id, keep.id)
  if (keep.email) byEmail.set(keep.email.toLowerCase(), keep)
  if (keep.identityDocument) byDocument.set(keep.identityDocument.toUpperCase(), keep)
  note(`client ${drop.id} ('${drop.name}') merged into ${keep.id} ('${keep.name}')`)
}

// ── Bookings ────────────────────────────────────────────────────────────────

const apartmentIds = new Set(apartments.map((a) => a.id))
const clientIds = new Set(clients.map((c) => c.id))
const channelIds = new Set(channels.map((c) => c.id))

const bookings = []
const orphans = []

for (const b of read('bookings')) {
  const id = oid(b._id)
  const clientId = clientIdMap.get(oid(b.client)) ?? oid(b.client)
  const apartmentId = oid(b.apartment)
  const channelId = oid(b.channel)

  const missing = []
  if (!apartmentIds.has(apartmentId)) missing.push(`apartment ${apartmentId}`)
  if (!clientIds.has(clientId)) missing.push(`client ${clientId}`)
  if (!channelIds.has(channelId)) missing.push(`channel ${channelId}`)
  if (missing.length > 0) {
    orphans.push(`booking ${id} (${day(b.fromDate)} – ${day(b.toDate)}) references missing ${missing.join(', ')}`)
    continue
  }

  // Legacy statuses predate the Active/Cancelled pair; some records have none.
  let status = 'Active'
  let paidDate = text(b.paidDate)
  if (b.status === 'Cancelled') status = 'Cancelled'
  else if (b.status === 'Paid') paidDate = paidDate ?? iso(b.createdAt).slice(0, 10)

  bookings.push({
    id,
    apartmentId,
    clientId,
    channelId,
    fromDate: day(b.fromDate),
    toDate: day(b.toDate),
    adultCount: num(b.adultCount, 1),
    childrenCount: num(b.childrenCount, 0),
    ...(b.cribRequested !== undefined ? { cribRequested: !!b.cribRequested } : {}),
    status,
    ...(paidDate !== undefined ? { paidDate } : {}),
    // `totalAmmountDue` is the legacy misspelling; many records simply lack it.
    totalAmountDue: num(b.totalAmmountDue ?? b.totalAmountDue, 0),
    ...(text(b.comment) !== undefined ? { comment: text(b.comment) } : {}),
    createdAt: iso(b.createdAt),
  })
}

// ── Write ───────────────────────────────────────────────────────────────────

mkdirSync(outDir, { recursive: true })
const write = (name, data) => {
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(data, null, 2), 'utf8')
  console.log(`${String(data.length).padStart(5)}  ${name}.json`)
}

write('apartments', apartments)
write('properties', properties)
write('clients', clients)
write('channels', channels)
write('bookings', bookings)
write('calendarLinks', [])

if (notes.length > 0) {
  console.log(`\n${notes.length} adjustment(s):`)
  for (const n of notes) console.log(`  - ${n}`)
}
if (orphans.length > 0) {
  console.log(`\n${orphans.length} booking(s) DROPPED for unresolvable references:`)
  for (const o of orphans) console.log(`  - ${o}`)
}

// Overlaps are legal in the schema but usually mean a genuine double booking.
const byApartment = new Map()
for (const b of bookings) {
  if (!byApartment.has(b.apartmentId)) byApartment.set(b.apartmentId, [])
  byApartment.get(b.apartmentId).push(b)
}
const overlaps = []
for (const [, list] of byApartment) {
  list.sort((a, b) => a.fromDate.localeCompare(b.fromDate))
  for (let i = 1; i < list.length; i++) {
    if (list[i].fromDate < list[i - 1].toDate) {
      overlaps.push(`${list[i - 1].id} (${list[i - 1].fromDate}–${list[i - 1].toDate}) vs ${list[i].id} (${list[i].fromDate}–${list[i].toDate})`)
    }
  }
}
if (overlaps.length > 0) {
  console.log(`\n${overlaps.length} overlapping booking pair(s) — imported as-is, review in the app:`)
  for (const o of overlaps) console.log(`  - ${o}`)
}
