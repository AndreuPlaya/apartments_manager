# User stories

Written from the three working roles defined in
[ACCESS_LEVELS.md](ACCESS_LEVELS.md), in the vocabulary of
[GLOSSARY.md](GLOSSARY.md). `viewer` has no stories of its own — it is every
`reception` read story with the writes removed.

Each story carries acceptance criteria that name the rule it depends on
(`L*` = [RESERVATION_LIFECYCLE.md](RESERVATION_LIFECYCLE.md),
`B*`/`E*` = [DOMAIN.md](DOMAIN.md)). Stories marked **[gap]** describe behaviour
the code does not have yet.

---

## Admin — users and the database

### A1. Add a colleague
*As an admin, I want to create an account for a new colleague with the role that
matches their job, so they can work without being able to break things outside it.*

- Username, full name, password and role are required.
- The username is unique on its normalized form — trimmed and lowercased — while
  the spelling they chose is what gets stored and shown (B23).
- Password is at least 8 characters (B22).
- **[gap]** Role is one of `admin`, `manager`, `reception`, `viewer`. Today only
  admin/viewer exist.

### A2. Disable a leaver without erasing them
*As an admin, I want to disable an account rather than delete it, so the register
still shows who recorded what.*

- A disabled account cannot log in and is told why, not given a generic failure (B24).
- Disabling is reversible; deleting is not.
- **[gap]** The `enabled` flag is not checked for admin accounts at login.

### A3. Never lock myself out
*As an admin, I want the system to stop me removing the last admin, so the
deployment cannot become unadministrable.*

- **[gap]** Deleting or disabling the final enabled admin is refused.

### A4. Get the first admin in
*As the person installing this, I want the empty deployment to walk me into
creating the first admin.*

- Until an admin exists the API reports a setup state and the router sends the
  user to `/setup` (B25).
- Once one exists, `/setup` is closed.

### A5. Correct a reservation that is in the wrong state
*As an admin, I want to move a reservation out of a terminal state when someone
recorded the wrong thing, so a mistake does not become permanent.*

- Overrides bypass L2 and L3; `reservation:override-status` is admin-only (L4).
- Managers and reception get a refusal, not a hidden button only.
- The override is a distinct, deliberate action in the UI — not the same control
  as an ordinary transition.

### A6. Back the whole thing up
*As an admin, I want a backup to be a file copy, so recovery needs no tooling.*

- All state is `$DATA_DIR`: `database/app.db` plus `config/settings.json`.
- A live copy needs `sqlite3 app.db ".backup out.db"` — WAL means a plain `cp` of
  a running database can catch a partial write.

### A7. Migrate the old JSON portfolio
*As an admin, I want the legacy JSON files imported on first boot, or to be told
exactly which record is wrong.*

- Import runs only when legacy files are present and the database is empty.
- One rejected record rolls back the entire import, leaves the JSON untouched,
  and fails startup with every offending record named.

---

## Manager — portfolio and pricing

### M1. Add a listing to the portfolio
*As a manager, I want to register a new listing with its address, capacity and
nightly rate, so it can start taking reservations.*

- Name is unique, case-insensitively (E1).
- Address, floor, door, `nightlyRate`, `minNights`, `maxGuests`, rooms and
  bathrooms are all required — a listing with unknown capacity cannot be
  validated against.
- A new listing is `isActive` by default.

### M2. Take a listing off the market without losing its history
*As a manager, I want to deactivate a listing under renovation, so no new
reservation lands on it while its past stays remain intact.*

- `isActive = false` blocks new reservations (B3).
- Existing reservations are untouched and still show in the calendar.
- A listing with any reservation cannot be deleted (E3) — deactivation is the
  answer, not deletion.

### M3. Set the rate and the stay limits
*As a manager, I want to set the nightly rate, minimum nights and maximum
guests, so the desk cannot accept a stay we do not want.*

- `minNights` is enforced on every reservation whose dates change (B7).
- `maxGuests` is enforced against `adultCount + childrenCount` (B-new).
- `nightlyRate` is reference information: it does not compute
  `totalAmountDue` (B11). Changing it never rewrites a recorded amount.

### M4. Add a channel and record what it costs us
*As a manager, I want each channel to carry its commission, so I can see what
the portfolio actually earns.*

- Channel name is unique, case-insensitively (E11).
- `commissionRate` is a percentage of `totalAmountDue`.
- Net revenue and commission are derived, never stored (B12).

### M5. Stop selling through a channel
*As a manager, I want to deactivate a channel, so no new reservation is
attributed to it while its history stays.*

- An inactive channel is refused on create and on reassignment (B5).
- A channel with any reservation cannot be deleted (E13).

### M6. Wire up channel calendars
*As a manager, I want one sync URL per channel and listing, so external
calendars line up with ours.*

- One link per (channel, listing) pair; writing the pair again replaces the URL
  rather than duplicating it (E17).
- The URL must parse as `http`, `https` or `webcal` (E18).
- Links disappear with their listing or channel — a sync URL carries no history
  worth protecting (E19).

### M7. See occupancy and revenue
*As a manager, I want monthly occupancy and revenue for the portfolio, so I can
tell a bad month from a bad listing.*

- Window is previous, current and next calendar year (B14).
- Occupancy is booked nights over `listings × days in month` (B15).
- Revenue is spread across the nights it was earned, not dumped on the check-in
  month (L11).
- Cancelled reservations count towards neither; no-shows count towards revenue
  only (L9, L10).

### M8. Price a stay the desk cannot
*As a manager, I want to be the only one who sets `totalAmountDue`, so the
amount owed is a decision and not a typo at the desk.*

- **[gap]** Reception is read-only on `totalAmountDue`
  (ACCESS_LEVELS §2). Today any admin writes it and reception writes nothing.

---

## Reception — the day

### R1. See today at a glance
*As reception, I want one screen showing who arrives, who leaves and who is
staying today, so I know what the day holds before anyone walks in.*

- Three groups: arriving (`checkIn = today`), departing (`checkOut = today`),
  in-house (`checkIn < today < checkOut`).
- Cancelled and no-show reservations never appear.
- Each row reaches the guest's phone number in one click — the thing actually
  needed when someone is late.

### R2. Check a guest in
*As reception, I want to mark a guest as arrived, so the rest of the team knows
they are in the unit.*

- `Confirmed → CheckedIn` (L2).
- No date gate: early and late arrivals are both recordable (L7).
- Nothing checks anyone in automatically (L8).

### R3. Check a guest out
*As reception, I want to close a stay when the guest leaves.*

- `CheckedIn → CheckedOut` (L2). A guest who was never checked in cannot be
  checked out — that is a correction, and corrections are admin work (L4).
- `CheckedOut` keeps holding its dates; a completed stay is still history (L2).

### R4. Record a no-show
*As reception, I want to mark a guest who never arrived, so the dates free up
while the money owed stays on the books.*

- `Confirmed → NoShow` (L2).
- The dates are released for resale (L5) but the amount still counts as revenue
  (L10) — the one place occupancy and revenue diverge, and deliberately so.

### R5. Cancel a stay
*As reception, I want to cancel a stay so the week can be re-let today.*

- `Confirmed → Cancelled` (L2), and the dates become immediately bookable (L5).
- The reservation stays in the register — it is the record of why an apparently
  free week went unsold (L6).
- Cancelling here does **not** cancel on the channel; that is done in the
  channel's own extranet.

### R6. Take a booking that came in by phone
*As reception, I want to enter a stay a guest just phoned in, so it holds the
dates before someone else books them.*

- Listing, guest, channel, `checkIn` and `checkOut` are all required (E14).
- Refused if the listing is inactive (B3), the dates are invalid (B4), the
  channel is inactive (B5), the guest does not exist (B6), the stay is under
  `minNights` (B7), the guest count is over `maxGuests`, or the dates overlap an
  existing stay on that listing (B8).
- The overlap check and the write share one immediate transaction, so two people
  taking calls at once cannot both book the same week (B10).
- Created `Confirmed` — never any other state (L1).

### R7. Book back-to-back
*As reception, I want to book a new guest arriving the day the last one leaves,
because that is a normal Saturday.*

- Stays are half-open: `checkOut` is immediately sellable (B8).
- No automatic turnover blocking. If cleaning needs a day, the manager sets it
  as a stay, not as a hidden rule.

### R8. Fix the dates on a stay
*As reception, I want to move a stay when a guest changes plans.*

- Changing the listing or either date revalidates the whole stay (B3–B8).
- Changing only the comment, payment or status does not — but it does still
  check the status transition is legal.

### R9. Register a guest with only a name
*As reception, I want to create a guest from a phone call before I have their
documents.*

- Only `name` is required (E7).
- Blank means *not provided*: two guests with no email do not collide (E9).
- Identity document and email, when given, are unique (E8).

### R10. Find the guest who is calling
*As reception, I want to search guests by name, document or phone, so I can find
someone mid-call.*

- Search covers name, identity document, email and phone.
- A guest's stays are reachable from their record.

### R11. Mark a stay as paid
*As reception, I want to record the day a stay was settled.*

- `paidDate` present means settled, absent means outstanding (B13).
- Recordable in any state, terminal ones included (L12) — a no-show settling a
  week later is normal.

### R12. Leave a note on a stay
*As reception, I want to write down what the guest asked for, so the next shift
knows.*

- Free-text comment, editable in any state.
- Editable inline from the calendar and the list, without opening a form.

### R13. See the whole month at once
*As reception, I want a calendar of listings against days, so I can see what is
free before I quote dates.*

- Rows are listings, columns are days; a stay is a bar.
- Cancelled and no-show stays are absent — their dates read as free, because
  they are (L5).
- Clicking a bar shows the guest, the amount and the state without leaving the
  calendar.

### R14. Know what is overdue
*As reception, I want stays that should have progressed flagged, so nothing sits
in the wrong state for a week.*

- `Confirmed` with `checkIn` in the past → *arrival unconfirmed*.
- `CheckedIn` with `checkOut` in the past → *departure unconfirmed*.
- Flagged for a human to resolve, never resolved automatically (L8).
- **[gap]** Not implemented.
