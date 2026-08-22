# UX

How the application should feel to use, and why. Vocabulary from
[GLOSSARY.md](GLOSSARY.md); the jobs it serves are in
[USER_STORIES.md](USER_STORIES.md); who may do what is in
[ACCESS_LEVELS.md](ACCESS_LEVELS.md).

---

## 1. Who is using this, and how

Three or four people, on the same handful of screens, every day, for years. Not
first-time visitors. That single fact decides almost everything below:

- **Speed over guidance.** A hint that helps on day one is noise on day two
  hundred. Explain in the empty state and in the error, not in the steady state.
- **Density over whitespace.** Reception wants today's whole day on one screen
  without scrolling. A calendar that shows twelve days is a calendar nobody uses.
- **Recognition over recall.** Same layout, same position, same colour every day.
  A control that moves is a control that gets missed.
- **Keyboard reachable.** The desk types faster than it points.

The mobile case is real but narrow: reception checking a guest in from a doorway,
a manager glancing at the week. Full editing is a desk activity.

---

## 2. The four screens

| Screen | Answers | Primary role |
|---|---|---|
| **Today** (`/`) | *What does today hold?* | reception |
| **Calendar** (`/calendar`) | *What is free?* | reception, manager |
| **Reservations** (`/reservations`) | *Find me this stay* | reception |
| **Metrics** (`/metrics`) | *How are we doing?* | manager |

Plus **Guests** (`/guests`) as a lookup surface, and **Config** (`/config`) for
listings, channels and users — a settings area, not a daily one.

The default landing screen is **Today**, because the most common reason to open
this application is that someone is arriving.

### Today

Three groups, always in this order, always visible without scrolling:
**arriving**, **departing**, **in-house**. Each row is one line: listing, guest,
nights, amount, and the one action that row is likely to need — *check in* on an
arrival, *check out* on a departure.

A phone number is one click from every row. When a guest is late, that is the
only thing anyone wants.

Under the three groups: **needs attention** — stays whose state has fallen behind
their dates (a `Confirmed` stay whose check-in has passed, a `CheckedIn` stay
past its checkout). Never resolved automatically (lifecycle L8); offered for a
human to confirm.

### Calendar

Listings down, days across. A stay is a bar spanning its nights. This is the
screen that answers *is that week free* and it must answer it in one glance:

- **Occupancy is the figure-ground.** Free cells are quiet; bars carry the
  colour. The eye should find gaps, not stays.
- **Bars are half-open**, like the data — a bar ends at the checkout day's
  boundary, so back-to-back stays visibly touch without overlapping. This is not
  a rendering detail; it is the rule (B8) made visible.
- **Cancelled and no-show stays are absent.** Their dates read as free because
  they *are* free (L5). Showing them greyed would say "unavailable", which is a lie.
- **Clicking a bar opens a popover, not a page.** The question was about that
  stay; losing the month to answer it is a bad trade. Comment, payment date and
  the legal status transitions are editable in place.
- **Today is a vertical rule**, not a highlighted column. It must be locatable
  while scrolled anywhere.

### Reservations

A filterable list for the times the calendar is the wrong shape: *find the
Muñoz stay*, *who has not paid*, *what did we cancel in March*. Search plus
status and payment filters. Inline edit for comment, payment and status; a modal
only for dates, listing, guest and amount — the fields that trigger revalidation.

### Metrics

Two charts, monthly, over the three-year window (previous, current, next):
occupancy and revenue. Manager-only, because commission and net figures are a
management view (ACCESS_LEVELS §2).

Occupancy and revenue must never contradict the calendar. That is a data rule
(L9, L10), but it shows up here first, and it is where the old model's
cancelled-stays-count-as-revenue bug was visible.

---

## 3. Showing reservation state

Five states, and they must be distinguishable without reading:

| State | Reads as | Rationale |
|---|---|---|
| `Confirmed` | neutral, brand-tinted | The normal case. Most of the calendar. |
| `CheckedIn` | filled, strongest weight | Someone is in the unit right now. The most urgent fact on screen. |
| `CheckedOut` | quiet, receded | Done. Present for history, not for attention. |
| `Cancelled` | absent from the calendar; struck through in lists | It holds nothing. |
| `NoShow` | warning-tinted, absent from the calendar | Money owed, nobody there. |

Rules for how state is drawn:

- **Never colour alone.** Every state carries an icon or a label as well.
  Roughly one in twelve men cannot separate the red/green pairing this palette
  would otherwise lean on.
- **Colour comes from the tokens** in `styles/_variables.scss` — the IXA
  chromatic identity. `--success`, `--warning`, `--danger` and `--info` are the
  state ramp; the mustard `--secondary` is for distinguishing marks, never for
  body text, and `--brand` is brand only, never text (§6 of the norm).
- **Both themes, always.** The published norm is the light palette; the dark one
  is its §5.2 inversion. Which of the two is the default is a product decision
  that has moved before and may move again, so any state styling must be legible
  in both — check, do not assume.

### Transitions as actions, not as a dropdown

The status control shows only the transitions the lifecycle allows from the
current state (L2, L3) — for a `Confirmed` stay: *check in*, *cancel*,
*no-show*. A closed dropdown of all five states invites illegal choices and
then rejects them, which teaches the user that the UI is lying.

Admin override (L4) is a **separate, deliberate control** — not the same widget
with more entries. Overriding a terminal state should feel like overriding
something.

---

## 4. Interaction rules

- **Inline edit for facts, modals for decisions.** A comment, a payment date, a
  status transition: edit in place, save on blur, no dialog. Dates, listing,
  guest and amount: a modal, because they revalidate the whole stay and can be
  refused.
- **Optimistic where it cannot fail, pending where it can.** A comment can save
  optimistically. A date change can be refused for overlap, so it waits for the
  server and says why.
- **Refusals name the conflict.** Never "invalid dates". Always *"overlaps
  14–21 March"*, *"minimum 3 nights for Sol II"*, *"maximum 4 guests"*. The
  services already produce these messages; the UI must not flatten them.
- **Confirm only what is irreversible.** Deleting a listing, deleting a guest,
  an admin override. Not cancelling a reservation — that is a business event and
  it is reversible by an admin.
- **One toast, top right, dismissible.** Errors persist until dismissed;
  successes fade. A success toast for something visible on screen is redundant —
  the row changing *is* the confirmation.
- **Loading is per-region, never per-page.** A page that blanks itself on every
  refetch loses the operator's place. Pages load their data in parallel
  (`usePageData`) and show what has arrived.
- **Empty states carry the next action.** "No reservations this month" plus a
  *new reservation* button, not just the sentence.

---

## 5. Hiding versus refusing

The client mirrors permissions; it never enforces them
(ACCESS_LEVELS §3). Two consequences:

- **A control the role cannot use is not rendered.** Reception does not see a
  disabled `totalAmountDue` field greyed out — it sees the amount as text. A
  disabled control invites a request that will be refused.
- **Every hidden control has a server rule behind it.** If the server would
  accept it, hiding it is a bug in the server, not a feature of the UI.

Read-only roles get the same screens, not lesser ones: `viewer` sees the whole
calendar and every amount, and edits nothing.

---

## 6. Language

Spanish and English, switchable from the nav, persisted per user. The vocabulary
in both is the glossary's: *reserva/reservation*, *huésped/guest*,
*alojamiento/listing*. Where the Spanish industry term differs from a literal
translation, the industry term wins — this is the same rule the glossary applies
to the code.

Dates are `dd/mm/yyyy` in Spanish and `yyyy-mm-dd` in English; amounts are euros
with the locale's separators. Never a bare number where a currency is meant.

---

## 7. What good looks like

Concrete, checkable claims — if any is false, the UX has regressed:

1. Reception can see every arrival and departure for today without scrolling or
   clicking.
2. Checking a guest in takes one click from Today.
3. The calendar shows at least a full month for the whole portfolio on a laptop
   screen.
4. Answering "is that week free" needs no click.
5. Every refusal names the specific conflicting stay, listing or limit.
6. No screen has a control that the current role's request would be refused for.
7. Every state is distinguishable with colour vision removed.
8. Both themes are legible on every screen.
