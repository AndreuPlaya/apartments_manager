# Reservation lifecycle

How a reservation should move through its states, and what each state means for
the calendar and for the books. Vocabulary is fixed by
[GLOSSARY.md](GLOSSARY.md); the reference rules it answers to (R1–R6, A1–A8) are
in [examples/guesty-business-rules.md](examples/guesty-business-rules.md).

The guiding principle: **this application is a register, not a sales channel.**
Nothing arrives here until it is a committed stay, so the lifecycle has no
pre-booking states. What it does have — and what the old two-state
`Active`/`Cancelled` model lacked — is the *operational* progress of the stay,
because that is the question reception asks all day: has this guest arrived yet?

---

## 1. The states

| State | Meaning | Holds the dates | Billable |
|---|---|---|---|
| **Confirmed** | The stay is committed. The guest has not arrived. | Yes | Yes |
| **CheckedIn** | The guest is in the listing. | Yes | Yes |
| **CheckedOut** | The stay is complete. | Yes | Yes |
| **Cancelled** | Called off before arrival. | **No** | No |
| **NoShow** | The guest never arrived and did not cancel. | **No** | Yes |

Two columns, two different questions, and they are not the same question:

- **Holds the dates** — does this reservation prevent another one on the same
  listing? Only states in which somebody is, was, or is still expected in the
  unit. A cancelled stay must free its dates for resale (reference R3); a no-show
  frees them too, because after the fact nobody occupied them.
- **Billable** — does this reservation's `totalAmountDue` count as revenue? A
  no-show is billable: the guest owes the money precisely because they did not
  come. A cancellation is not.

`CheckedOut` still holds its dates. It is a past stay; releasing it would let
someone double-book history.

---

## 2. Transitions

```
                    ┌──────────────┐
                    │  Confirmed   │ ◀── created here, always
                    └──────┬───────┘
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
      ┌────────────┐ ┌───────────┐ ┌──────────┐
      │ CheckedIn  │ │ Cancelled │ │  NoShow  │
      └─────┬──────┘ └───────────┘ └──────────┘
            ▼            terminal      terminal
      ┌────────────┐
      │ CheckedOut │
      └────────────┘
          terminal
```

| From | Allowed to |
|---|---|
| `Confirmed` | `CheckedIn`, `Cancelled`, `NoShow` |
| `CheckedIn` | `CheckedOut` |
| `CheckedOut` | — |
| `Cancelled` | — |
| `NoShow` | — |

### The rules this encodes

- **L1 — Every reservation is created `Confirmed`.** The client may not choose an
  initial state; there is no way to file a stay that never existed.
- **L2 — Forward only** (reference R1). The graph is acyclic. A guest who has
  checked in cannot un-arrive.
- **L3 — Terminal is terminal** (reference R2). `CheckedOut`, `Cancelled` and
  `NoShow` accept no further transition. Correcting a mistake means an admin
  override (L4), not a state change.
- **L4 — Admins override.** A user with `reservation:override-status` may set any
  state from any state, including out of a terminal one. This is the reference's
  A8 (*manual override*) applied to the lifecycle: the rule set exists to stop
  the daily flow going wrong, never to stop a trusted operator correcting the
  register. Every override is a deliberate, audited act, not the normal path.
- **L5 — Cancelling releases the dates** (reference R3). The moment the state
  stops holding dates, the overlap check stops seeing it, and the dates are
  sellable again.
- **L6 — A cancellation is never deleted.** Cancelled and no-show reservations
  stay in the register. They are the record of *why* an apparently free week was
  not sold. Deletion is a correction of a data-entry error, not a business event.

### Why cancellation is not a soft delete

The old model let `Cancelled` block the calendar and count towards revenue —
which meant a cancelled week looked sold in the metrics and could not be re-let
in the calendar. Both symptoms had the same cause: status was stored but never
consulted. L5 fixes the calendar; §4 fixes the books.

---

## 3. Time and the lifecycle

The lifecycle is a state machine, not a clock. Dates constrain the *stay*, never
the *state*:

- **L7 — No date gate on check-in.** Reception may check a guest in early or
  late. Real arrivals do not respect the plan, and a rule that rejects them
  would only teach the operator to edit the dates to get past it — corrupting
  the very record we are keeping.
- **L8 — Nothing transitions on its own.** No scheduled job promotes `Confirmed`
  to `NoShow` at midnight, or `CheckedIn` to `CheckedOut` on the checkout date.
  A state is a statement someone made, and an unattended state change is a
  statement nobody made. The UI surfaces what looks overdue (see
  [UX.md](UX.md) §4) and lets a human confirm it.

L8 is the reason `CheckedOut` exists as a state at all rather than being
inferred from `checkOut < today`: the inference is usually right and occasionally
wrong, and reception needs to know which stays it has actually closed.

---

## 4. What each state does to the numbers

| | Occupancy | Revenue |
|---|---|---|
| `Confirmed` | counted | counted |
| `CheckedIn` | counted | counted |
| `CheckedOut` | counted | counted |
| `Cancelled` | excluded | excluded |
| `NoShow` | **excluded** | **counted** |

- **L9 — Occupancy counts nights somebody occupied or is expected to occupy.**
  It follows the *holds the dates* column exactly, so a listing's occupancy and
  its calendar can never disagree.
- **L10 — Revenue counts what is owed.** It follows the *billable* column. A
  no-show owes the money, so it appears in revenue and not in occupancy — the
  one place the two columns diverge, and the reason they are two columns.
- **L11 — Revenue is spread across the nights it was earned.** A stay from
  28 January to 4 February for €700 is €400 of January and €300 of February, not
  €700 of January. Attributing a whole stay to its check-in month makes every
  month-boundary stay misreport two months at once, and the error is largest
  exactly where it matters — long stays and turn-of-year reporting.

---

## 5. Payment is orthogonal

`paidDate` is not a state. A reservation can be `Confirmed` and paid, `NoShow`
and unpaid, `CheckedOut` and outstanding. Folding payment into the status
enumeration would multiply five states into ten and make "has this guest
arrived?" unanswerable without also knowing whether the money came in.

- **L12 — Payment can be recorded in any state**, including terminal ones. A
  no-show settling their bill a week later is normal, and L3 must not block it.

---

## 6. What we still do not model

Named so that their absence is a decision:

- **Cancellation fees** (reference R4). We have no rate plans and no fee
  breakdown, so a cancellation zeroes nothing — the operator edits
  `totalAmountDue` if money is still owed. If cancellation policies ever land,
  this is where they attach.
- **Channel-side cancellation** (reference R5). Cancelling here does not cancel
  on Airbnb. The calendar links are one-way.
- **Modification history.** We store the current state, not the path taken to
  it. An audit trail of transitions is the obvious next addition and the natural
  home for L4 overrides.
- **Overbooking.** L5 plus the overlap check make double-booking impossible
  rather than flagged. A portfolio with sub-units would need the opposite.
