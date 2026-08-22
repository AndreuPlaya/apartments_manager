# Domain model and business rules

The domain of **IxaGrupPortal** as it is implemented today, in the canonical
vocabulary of [GLOSSARY.md](GLOSSARY.md).

This is a description of the code, not a wish list. Where a rule is designed but
not built, it says so and points at the document that designs it.
[ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md) covers *where* the code
lives; this covers *what it decides*.

| Companion document | Covers |
|---|---|
| [GLOSSARY.md](GLOSSARY.md) | One word per concept, across every layer |
| [RESERVATION_LIFECYCLE.md](RESERVATION_LIFECYCLE.md) | The five states and the transitions between them |
| [ACCESS_LEVELS.md](ACCESS_LEVELS.md) | The four roles and what each may write |
| [USER_STORIES.md](USER_STORIES.md) | The jobs each role needs done |
| [UX.md](UX.md) | How the screens should behave |
| [examples/guesty-business-rules.md](examples/guesty-business-rules.md) | The reference extract this vocabulary comes from |

---

## 1. What the application is

An internal **register of stays** for a portfolio of rental listings. Every user
is authenticated; there is no guest-facing surface, no distribution, no inbox
and no pricing engine. Where the reference PMS *sells* availability, we *record*
what was already sold — which is why almost every rule here validates a fact
rather than gating a sale.

The core question it answers: **for each listing, who arrives, who leaves, and
how much is owed.**

---

## 2. Vocabulary, mapped to the reference

| Ours | Reference equivalent | Note |
|---|---|---|
| **Listing** | Listing (single-unit) | The bookable unit. No multi-units, sub-units or complexes. |
| **Reservation** | Reservation | Always a committed stay; no inquiry or quote stage. |
| **Guest** | Guest | A reusable person profile, independent of any stay. |
| **Channel** | Booking channel | Where the reservation came from. |
| **Calendar link** | Channel calendar sync | One URL per (channel, listing) pair. |
| **Stay** | Stay | The half-open interval `[checkIn, checkOut)`. |

`Property` was removed. It was an inventory table nothing referenced, with no
relation to listings and no writer after the first release; keeping it meant two
answers to "what do we rent". Migration `002_consolidate_vocabulary` drops it.

**A reservation is always a reservation, never an inquiry.** There is no held or
pending state — see §4.

---

## 3. Entities and their invariants

Uniqueness and referential integrity are enforced by the schema
(`infrastructure/migrations.ts`), not by services, so no service re-checks them.

### Listing
`name, address, floor, door, nightlyRate, minNights, maxGuests, rooms, bathrooms, isActive, description?`

- **E1** Name is unique, case-insensitively (`lower(name)`).
- **E2** `isActive` marks the listing as lettable at all. See B3.
- **E3** A listing with any reservation cannot be deleted (`ON DELETE RESTRICT`
  plus an explicit check in `listingService`). Deactivation is the answer.

### Guest
`identityDocument?, name, email?, phoneNumber?, street?, city?, country?, zipCode?, comment?`

- **E4** Only `name` is required. The desk records a stay before the paperwork
  exists.
- **E5** Identity document is unique case-insensitively (`upper()`); email is
  unique case-insensitively (`lower()`).
- **E6** A blank string means *not provided*, not a value to hold unique — the
  create form submits empty strings for untouched fields, and every such guest
  would otherwise collide with the first (`guestService.blankToUndefined`).
- **E7** A guest with any reservation cannot be deleted.

### Channel
`name, commissionRate, isActive`

- **E8** Name is unique, case-insensitively.
- **E9** `isActive` gates new reservations. See B5.
- **E10** A channel with any reservation cannot be deleted.

### Reservation
`listingId, guestId, channelId, checkIn, checkOut, adultCount, childrenCount, cribRequested?, status, paidDate?, totalAmountDue, comment?, createdAt`

- **E11** All three references are mandatory. An unattributed stay is not
  something we record.
- **E12** Dates are stored as `YYYY-MM-DD`; any time component in the request is
  stripped (`stripTime`). Stays are day-grained, never hour-grained.
- **E13** `status` is constrained by the schema to the five lifecycle states.
- **E14** `createdAt` is assigned by the server and is immutable.

### Calendar link
`channelId, listingId, url`

- **E15** At most one link per (channel, listing) pair — writing the pair again
  updates the URL rather than duplicating it.
- **E16** The URL must parse and use `http`, `https` or `webcal`.
- **E17** Links cascade away with their listing or channel — unlike a
  reservation, a sync URL carries no history worth protecting.

---

## 4. Reservation lifecycle

Five states. [RESERVATION_LIFECYCLE.md](RESERVATION_LIFECYCLE.md) is the
authority; the rules the code enforces are:

| State | Holds the dates | Billable |
|---|---|---|
| `Confirmed` | yes | yes |
| `CheckedIn` | yes | yes |
| `CheckedOut` | yes | yes |
| `Cancelled` | no | no |
| `NoShow` | no | yes |

- **B1** Every reservation is created `Confirmed`. `CreateReservationRequest`
  omits `status` entirely, so there is no way to file a stay that never existed
  (lifecycle L1).
- **B2** Transitions follow an acyclic graph: `Confirmed → CheckedIn | Cancelled
  | NoShow`, `CheckedIn → CheckedOut`. `CheckedOut`, `Cancelled` and `NoShow`
  are terminal (L2, L3). The graph lives in
  `domain/reservationStatus.ts` and is enforced on **both** write paths.
- **B3** Resending the current status is a no-op, not a transition — a patch
  that carries the status alongside a comment is not a state change.
- **B4** An **override** lifts the graph and nothing else. It is opt-in
  (`PATCH /api/admin/reservations/:id?override=true`), audited as `override`
  rather than `update`, and cannot double-book: every stay rule still runs (L4).

---

## 5. Availability rules

Checked by `reservationService.assertStayIsBookable` / `assertNoOverlap` on
create, and on update whenever the listing, either date, or either guest count
changes.

- **B5 — Listing must be active.** A listing with `isActive = false` accepts no
  reservations.
- **B6 — Valid range.** `checkOut` must be strictly after `checkIn`; zero-night
  stays are rejected.
- **B7 — Channel must be active.** An inactive channel accepts no new
  reservations and cannot be assigned to an existing one.
- **B8 — Guest must exist.** Checked explicitly, ahead of the foreign key, so
  the operator gets a domain error rather than a constraint violation.
- **B9 — Minimum nights.** `nights >= listing.minNights` (reference A1).
- **B10 — Maximum guests.** `adultCount + childrenCount <= listing.maxGuests`
  (reference A7). The refusal names the limit and the number asked for.
- **B11 — No overlap.** Within one listing, no two stays that hold their dates
  may intersect. Stays are **half-open**
  (`checkIn < other.checkOut AND checkOut > other.checkIn`), so a checkout day is
  immediately sellable — back-to-back stays are legal, which is the opposite of
  the reference's A5 turnover blocking.
- **B12 — Released states do not block.** `findOverlapping` filters on the
  date-holding statuses, so cancelling or marking a no-show frees the week for
  resale the same second (lifecycle L5). `CheckedOut` still blocks: a past stay
  is history, not free space.

Reference rules A2 (maximum nights), A3 (booking window), A4 (advance notice),
A5 (turnover) and A6 (check-in window) have no equivalent here.

Reference rule **A8 (manual override) is our default posture, not an
exception**: every reservation is entered by hand by a trusted operator, so the
rule set stays deliberately thin. B4 is the same principle applied to the
lifecycle.

### Concurrency

**B13** The overlap check and the write share a single `transaction()`.
`BEGIN IMMEDIATE` takes the write lock before the check runs, so two concurrent
requests cannot both pass the check for the same dates. SQLite has no exclusion
constraint, which is why this invariant lives in the service rather than the
schema.

---

## 6. Financial rules

- **B14 — The amount is recorded, not computed.** `totalAmountDue` is entered by
  the operator. `nightlyRate` is reference information; nothing multiplies it by
  nights. There is no quote and no rate plan (contrast reference F2).
- **B15 — Commission is derived, never stored.** `channel.commissionRate` is a
  percentage of `totalAmountDue`; metrics report gross, commission and net from
  it (reference F1). Re-rating a channel restates the report rather than
  rewriting history.
- **B16 — Payment is a date, not a state.** `paidDate` present means settled,
  absent means outstanding, and it can be set in any state including terminal
  ones (lifecycle L12). No partial payments, no fees, no cancellation charge
  (reference R4 / F3 not implemented).

### Metrics (`domain/metrics.ts`)

- **B17 — Window.** Previous, current and next calendar year.
- **B18 — Occupancy** is `bookedNights / (listingCount × daysInMonth)`, rounded
  to two decimals, counting only statuses that hold their dates (lifecycle L9).
  Each night is attributed to the month it falls in, so a stay crossing a month
  boundary is split.
- **B19 — Revenue** counts every billable status (L10) and is **spread across
  the nights it was earned** (L11): 28 January – 4 February for €700 is €400 of
  January and €300 of February. Commission and net split with it. Cumulative
  gross is year-to-date and restarts each January.
- **B20 — A zero-night stay contributes nothing** rather than dividing by zero.

The one place occupancy and revenue diverge is `NoShow`: excluded from
occupancy, counted in revenue. That divergence is the reason they are two
questions.

---

## 7. Access control

**Implemented today: two roles.** Four are designed in
[ACCESS_LEVELS.md](ACCESS_LEVELS.md) and not yet built.

- **B21 — Read is shared, write is admin-only.** Every mutation lives under
  `/api/admin/*` behind `authMiddleware + adminMiddleware`; every read lives
  under `/api/*` behind `authMiddleware` alone. The boundary is the route prefix,
  which is why no service needs a role check — and the reason that trick has to
  go when `manager` and `reception` arrive, since they write different *fields*
  of the same resource.
- **B22 — Employees are read-only.** A non-admin sees the full calendar,
  arrivals and departures, guest details and billed amounts, and can change
  nothing but their own profile and password.
- **B23 — Self-service is the one exception.** `PATCH /api/profile` and
  `/api/profile/password` mutate without admin, scoped to the caller.
- **B24 — Changing a password requires the current one**, admins included.
- **B25 — Passwords are at least 8 characters**, bcrypt with 12 rounds. Legacy
  PBKDF2 hashes from the previous application still verify.
- **B26 — Usernames are unique on their normalized form** — trimmed and
  lowercased — while the spelling the user chose is what gets stored and shown.
  Accounts migrated from the old app were capitalized, so comparing the
  normalized form makes the spelling irrelevant.
- **B27 — A disabled employee account cannot log in** and is told so
  (`Account disabled`) rather than given the generic `Invalid credentials`. The
  check applies to `users` only; an admin's `enabled` flag is not consulted at
  login.
- **B28 — First run.** Until an admin exists the API reports a setup state and
  the router sends the user to `/setup`, the only way to create the first admin.
- **B29 — Status override is admin-only** (B4) — the one four-role rule already
  live, because the lifecycle needed it.

---

## 8. Migrating in

Two separate paths, both one-shot.

### From the legacy JSON files

`infrastructure/importJson.ts` runs on every boot and does nothing unless legacy
JSON files are present *and* the database is empty.

- **B30 — Legacy field names are translated at the boundary.** The files speak
  the pre-consolidation vocabulary (`apartmentId`, `clientId`, `fromDate`,
  `toDate`, `price`, `isAvailable`). They are input from an application we no
  longer control, so their names are not ours to rename: `readLegacyListings`,
  `readLegacyReservations` and `readLegacyCalendarLinks` translate them, and
  nothing else in the codebase knows the old words.
- **B31 — Legacy statuses collapse to `Confirmed`.** `Active`, `NotPaid`, `Paid`
  and a missing status all described a live stay. `Paid` additionally carried its
  payment date in the status, which becomes `paidDate` (falling back to the
  creation day). `Cancelled` passes through.
- **B32 — All or nothing.** One rejected record rolls back the whole import,
  leaves the JSON untouched and fails startup with every offending record named.

### From a database at migration 001

`002_consolidate_vocabulary` renames the tables and columns, drops `properties`,
and rebuilds `reservations` — a rebuild rather than a rename because SQLite
cannot alter a `CHECK` constraint in place.

- **B33 — Live stays are placed by their own dates.** The old model had one live
  state, so a finished stay and one starting tomorrow were indistinguishable.
  `Active` becomes `CheckedOut`, `CheckedIn` or `Confirmed` according to the
  stay's dates. Without this, every past stay would land in reception's
  *arrival unconfirmed* queue on the morning of the upgrade.

---

## 9. Remaining divergences from the reference

Named so their absence is a decision, not an oversight.

| # | Divergence | Reference rule |
|---|---|---|
| 1 | No maximum nights, booking window, advance notice, turnover or check-in window. | A2–A6 |
| 2 | No cancellation fees — a cancellation zeroes nothing; the operator edits the amount. | R4 |
| 3 | Cancelling here does not cancel on the channel. The calendar links are one-way. | R5 |
| 4 | No transition history. We store the current state, not the path to it — the natural home for override auditing beyond the log line. | — |
| 5 | No rate plans, quotes, coupons or taxes; `totalAmountDue` is typed in. | F2 |
| 6 | Four roles are designed but only two are built. | — |

Everything in the previous revision's divergence table that produced wrong
numbers or accepted wrong data is now fixed: cancelled stays release their dates
(B12) and leave the metrics (B18, B19), guest counts are checked against
capacity (B10), the inline-edit path validates transitions (B2), revenue is
spread across its nights (B19), and commission is applied (B15).
