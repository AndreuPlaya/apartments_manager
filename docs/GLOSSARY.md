# Glossary — the canonical vocabulary

One word per concept, everywhere: domain types, SQL tables, HTTP routes, Vue
components, UI labels, tests and documentation. Where our old word differed from
the industry term, **the industry term wins** — the reference extract in
[examples/guesty-business-rules.md](examples/guesty-business-rules.md) is what
an operator arriving from Guesty, Hostaway or Booking.com already knows.

This file is the authority. If code and this table disagree, the code is wrong.

---

## 1. Entities

| Canonical | Was | Definition |
|---|---|---|
| **Listing** | `Apartment` | The bookable unit. What a reservation points at. One address may hold several. |
| **Reservation** | `Booking` | A committed claim on one listing for one date range by one guest. |
| **Guest** | `Client` | The person a reservation belongs to. A reusable profile, independent of any stay. |
| **Channel** | `Channel` | The distribution source a reservation arrived through (Airbnb, Booking.com, direct). |
| **Calendar link** | `CalendarLink` | The sync URL for one (channel, listing) pair. |
| **Stay** | — | The half-open interval `[checkIn, checkOut)` a reservation covers. Not stored; the word for the interval. |
| **Night** | — | The unit of occupancy and of pricing. A stay of *n* nights spans *n+1* days. |
| — | ~~`Property`~~ | **Removed.** It was a parallel inventory record with no relation to anything and nothing pointing at it. A listing is the only unit this application knows. |

### Why "Listing" and not "Apartment"

`Apartment` names the *physical thing*; `Listing` names *the thing you can
book*. The distinction matters as soon as a room in an apartment is let
separately, or two units at one address are sold independently — the reference
handles this with single-units, sub-units and complexes. We support only the
simplest case today, but the word leaves room for the rest, and it stops the
codebase from claiming every rentable thing is a flat.

---

## 2. Fields

| Canonical | Was | Note |
|---|---|---|
| `checkIn` | `fromDate` | Arrival day, `YYYY-MM-DD`. |
| `checkOut` | `toDate` | Departure day, `YYYY-MM-DD`. Exclusive — the checkout day is sellable to the next guest. |
| `nightlyRate` | `price` | The listing's reference rate **per night**. `price` never said of what. |
| `isActive` | `isAvailable` (listing) | Whether the listing is being let at all. Renamed because *availability* now means "are these dates free", which is a different question. Matches `Channel.isActive`. |
| `minNights` | `minNights` | Reference term (rule A1). Kept. |
| `maxGuests` | `maxGuests` | Reference term (rule A7). Kept. |
| `totalAmountDue` | `totalAmountDue` | Gross amount the guest owes, channel commission included. |
| `paidDate` | `paidDate` | Present means settled; absent means outstanding. |
| `commissionRate` | `commissionRate` | The channel's cut, as a percentage of `totalAmountDue`. |
| `adultCount` / `childrenCount` | unchanged | Together they are the *guest count*, checked against `maxGuests`. |
| `cribRequested` | unchanged | |
| `identityDocument` | unchanged | |

Deliberately **not** renamed: `adultCount`/`childrenCount` and
`identityDocument` are already unambiguous, and churning them would cost
diffs without buying clarity.

---

## 3. Reservation status

The full lifecycle lives in
[RESERVATION_LIFECYCLE.md](RESERVATION_LIFECYCLE.md). The vocabulary:

| Canonical | Was | Reference equivalent |
|---|---|---|
| `Confirmed` | `Active` | *Confirmed* |
| `CheckedIn` | — | (operational, no direct equivalent) |
| `CheckedOut` | — | (operational) |
| `Cancelled` | `Cancelled` | *Canceled* |
| `NoShow` | — | (operational) |

`Active` became `Confirmed` because *active* said nothing about where in the
stay the guest was — and reception needs exactly that.

We do **not** adopt the reference's `Inquiry`, `Reserved`, `Declined` or
`Closed`: nothing reaches this register until it is a committed stay, so there
is nothing to hold and nothing to decline.

---

## 4. Roles

Defined in [ACCESS_LEVELS.md](ACCESS_LEVELS.md).

| Canonical | Was | Meaning |
|---|---|---|
| `admin` | `admin_users` | Owns users, configuration and the database. |
| `manager` | — | Owns the portfolio: listings, rates, channels. |
| `reception` | — | Owns the day: arrivals, departures, guests, payments. |
| `viewer` | `users` | Reads everything operational, writes nothing. |

---

## 5. Words we do not use

| Avoid | Use instead | Why |
|---|---|---|
| booking | reservation | One word per concept. *Booking channel* is the exception — it is the reference's own compound. |
| client, customer | guest | *Client* reads like a B2B account. |
| apartment, flat, unit, property | listing | See §1. |
| available (of a listing) | active | *Available* is about dates, not about the listing. |
| price, cost, fee | nightly rate, total amount due | Say which. |
| tenant | guest | Long-term lets are still stays by a guest. |
| user (meaning a guest) | guest | A *user* is someone who logs in. |

---

## 6. Surface names this fixes

| Layer | Before | After |
|---|---|---|
| SQL tables | `apartments`, `bookings`, `clients`, `properties` | `listings`, `reservations`, `guests` (properties dropped) |
| Read routes | `/api/apartments`, `/api/bookings`, `/api/clients`, `/api/properties` | `/api/listings`, `/api/reservations`, `/api/guests` |
| Write routes | `/api/admin/{apartments,bookings,clients,properties}` | `/api/admin/{listings,reservations,guests}` |
| Types | `Apartment`, `Booking`, `Client`, `Property` | `Listing`, `Reservation`, `Guest` |
| Services | `apartmentService`, `bookingService`, `clientService`, `propertyService` | `listingService`, `reservationService`, `guestService` |
| Client routes | `/bookings`, `/clients` | `/reservations`, `/guests` |
| i18n keys | `bookings.*`, `clients.*`, `apartments.*` | `reservations.*`, `guests.*`, `listings.*` |
