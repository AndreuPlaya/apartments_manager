# Reference: Guesty — extracted business rules

Guesty is the reference point used in this repository for short-term-rental PMS
vocabulary. It is repeatedly named the market-leading cloud-native PMS for
short-term rentals in 2026 comparisons ([SendSquared][s1],
[Lighthouse][s2], [Rentals United][s3]), with Hostaway, Hospitable, OwnerRez and
Hostfully as the closest alternatives and Mews / Cloudbeds as the hotel-leaning
equivalents.

This file is a **reference extract**, not a specification of our application.
Its purpose is to fix a shared vocabulary — *listing*, *reservation*, *stay*,
*block*, *availability rule* — so that `docs/DOMAIN.md` can describe our own
rules in language an operator already recognises. Nothing here is implemented
unless `docs/DOMAIN.md` says so.

---

## 1. Vocabulary

| Guesty term | Meaning |
|---|---|
| **Listing** | The bookable entity a guest reserves. Not the building. |
| **Single-unit** | A listing that is one physical unit. |
| **Multi-unit** | A listing covering several interchangeable units of the same type at the same address. |
| **Sub-unit** | One of the units comprising a multi-unit. |
| **Complex** | Several different unit types under the same roof. |
| **Room type** (*unit type*) | The sleeping arrangement of a listing; one listing may have several. |
| **Reservation** | A guest's confirmed or pending claim on a listing for a date range. |
| **Inquiry** | A pre-booking conversation carrying dates, listing and guest count, with no reservation number. |
| **Quote** | A priced offer for a stay; booking through it produces a reservation. |
| **Guest** | The person the reservation belongs to; carries a reusable profile. |
| **Booking channel** | The distribution source of the reservation (Airbnb, Booking.com, Vrbo, direct). |
| **Rate plan** | The pricing and policy package a reservation is sold under, including cancellation fees. |
| **Block** | Calendar occupancy that is not a reservation (owner stay, maintenance, turnover). |
| **Availability rule** | A constraint that decides whether a date range can be booked at all. |

The distinction that matters most: **a listing is what gets booked, an address
is where it is**. Guesty keeps them separate so that one address can carry many
bookable things.

---

## 2. Reservation lifecycle

Statuses, and whether each one occupies the calendar:

| Status | Meaning | Blocks the calendar |
|---|---|---|
| **Inquiry** | Guest asked about dates without requesting a booking. No reservation number. | No |
| **Reserved** | Dates are held for the guest for a limited period. | Yes |
| **Confirmed** | The stay is committed — the guest booked, or the operator confirmed manually. | Yes |
| **Declined** | The guest declined a *Reserved* reservation, or the operator rejected an inquiry for lack of availability. | No |
| **Canceled** | A *Confirmed* reservation was cancelled by guest or operator. | No — the block is removed |
| **Closed** | An inquiry the guest abandoned or withdrew. | No |

Transition rules:

- **R1 — Forward only.** Once *Confirmed*, a reservation can never return to
  *Reserved* or *Inquiry*.
- **R2 — Terminal is terminal.** *Canceled*, *Declined* and *Closed* are
  inactive statuses and cannot be reactivated. Recording the stay again means
  creating a new reservation.
- **R3 — Cancelling releases the dates.** Cancellation removes the calendar
  block, making the dates sellable again.
- **R4 — Cancellation is priced.** If the rate plan or policy defines a
  cancellation fee, the original fees are voided and replaced by that fee.
- **R5 — The channel owns its reservations.** Channel-originated reservations
  are cancelled in the channel's extranet, not in the PMS (Vrbo excepted).
- **R6 — Declined vs. closed.** *Declined* is the operator's refusal; *Closed*
  is the guest walking away. The distinction is kept because it is a different
  business fact, not a different technical state.

---

## 3. Availability rules

Each rule answers "may this date range be booked?" independently; a range must
satisfy all of them.

- **A1 — Minimum nights.** A stay shorter than the listing's minimum is not
  bookable.
- **A2 — Maximum nights.** A stay longer than the listing's maximum is not
  bookable (Guesty caps this at 1125 nights).
- **A3 — Booking window.** Dates beyond N months from today are not yet
  sellable.
- **A4 — Advance notice (cut-off hours).** Check-in must be at least N days (or
  a same-day cut-off hour) after the moment of booking.
- **A5 — Preparation time (turnover).** One or two nights before and after each
  confirmed reservation are blocked automatically for turnover.
- **A6 — Check-in window.** New check-ins can be restricted to a window after a
  previous check-out.
- **A7 — Occupancy.** Guest count may not exceed the listing's capacity. What
  counts as a guest is the operator's to define: ours counts adults only, since
  a child shares a bed or takes a crib (see DOMAIN.md B10).
- **A8 — Manual override.** A reservation created by hand may be confirmed
  regardless of A1–A7. The operator's judgement outranks the rule set.

A8 is the load-bearing rule of the whole set: availability rules exist to stop
*guests* booking the wrong thing, never to stop the *operator* recording a fact
that already happened.

---

## 4. Financial rules

- **F1 — Channel commission.** Each booking channel carries a commission rate
  applied to reservations arriving through it.
- **F2 — The quote is the price.** Money on a reservation originates from a
  quote and its rate plan, not from ad-hoc arithmetic at booking time.
- **F3 — Fees follow status.** A status change that voids a stay voids its fees
  (see R4).

---

## 5. What we deliberately do not borrow

Guesty is a distribution platform; we are an internal register of stays. We do
not model rate plans, quotes, coupons, taxes, unified inboxes, owner statements,
trust accounting, dynamic pricing or automated messaging. We borrow the
*vocabulary* and the *shape of the lifecycle*, not the surface area.

---

Sources:

- [Best Short-Term Rental Software 2026 — SendSquared][s1]
- [Best PMS for short-term rentals (2026 comparison) — Lighthouse][s2]
- [The 7 Best Vacation Rental Software — Rentals United][s3]
- [Reservation statuses: Overview — Guesty Help Center](https://help.guesty.com/hc/en-gb/articles/9369679396253-Reservation-statuses-Overview)
- [Changing the status of a reservation — Guesty Help Center](https://help.guesty.com/hc/en-gb/articles/9369138225949-Changing-the-status-of-a-reservation)
- [Canceling a Booking or Inquiry — Guesty Open API](https://open-api-docs.guesty.com/docs/canceling-a-booking-or-inquiry)
- [Utilizing availability tools to control when a listing can be booked — Guesty Help Center](https://help.guesty.com/hc/en-gb/articles/24372252863261-Utilizing-availability-tools-to-control-when-a-listing-can-be-booked)
- [Best practices: Availability settings — Guesty Help Center](https://help.guesty.com/hc/en-gb/articles/9372022362781-Availability-settings-Best-practices)
- [Creating a listing (single-unit, multi-unit and complex) — Guesty Help Center](https://help.guesty.com/hc/en-gb/articles/9364048715421-Creating-a-listing-single-unit-multi-unit-and-complex)
- [Multi-units, explained — Guesty](https://www.guesty.com/blog/multi-units-explained-how-guesty-supports-the-management-of-multi-unit-short-term-rental-properties/)

[s1]: https://sendsquared.com/blog/best-short-term-rental-software-2026/
[s2]: https://www.mylighthouse.com/resources/blog/best-pms-for-short-term-rentals
[s3]: https://rentalsunited.com/blog/the-7-best-vacation-rental-software-comparison/
