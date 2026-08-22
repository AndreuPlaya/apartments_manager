import type { ReservationStatus } from './models.js'

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'Confirmed',
  'CheckedIn',
  'CheckedOut',
  'Cancelled',
  'NoShow',
] as const

/**
 * States in which the reservation occupies its dates.
 *
 * `CheckedOut` still holds them — it is a past stay, and releasing it would let
 * someone double-book history. `Cancelled` and `NoShow` do not: nobody
 * occupied those nights, so they are sellable again.
 *
 * docs/RESERVATION_LIFECYCLE.md §1
 */
const HOLDS_DATES: ReadonlySet<ReservationStatus> = new Set<ReservationStatus>([
  'Confirmed',
  'CheckedIn',
  'CheckedOut',
])

/**
 * States in which the money is owed.
 *
 * Identical to `HOLDS_DATES` but for `NoShow`, which is billable precisely
 * because the guest did not come. That single difference is why occupancy and
 * revenue are two questions and not one.
 */
const BILLABLE: ReadonlySet<ReservationStatus> = new Set<ReservationStatus>([
  'Confirmed',
  'CheckedIn',
  'CheckedOut',
  'NoShow',
])

/** Legal transitions from each state. Terminal states map to nothing. */
const TRANSITIONS: Readonly<Record<ReservationStatus, readonly ReservationStatus[]>> = {
  Confirmed: ['CheckedIn', 'Cancelled', 'NoShow'],
  CheckedIn: ['CheckedOut'],
  CheckedOut: [],
  Cancelled: [],
  NoShow: [],
}

export function holdsDates(status: ReservationStatus): boolean {
  return HOLDS_DATES.has(status)
}

export function isBillable(status: ReservationStatus): boolean {
  return BILLABLE.has(status)
}

/** The statuses that occupy dates, for the SQL overlap check to filter on. */
export const DATE_HOLDING_STATUSES: readonly ReservationStatus[] = RESERVATION_STATUSES.filter(
  holdsDates,
)

export function allowedTransitions(from: ReservationStatus): readonly ReservationStatus[] {
  return TRANSITIONS[from]
}

/**
 * Whether the lifecycle permits `from → to`.
 *
 * Staying put is always allowed: a patch that resends the current status
 * alongside a comment is not a transition. Everything else follows the graph,
 * which is acyclic — a guest who has checked in cannot un-arrive, and a
 * terminal state accepts nothing (docs/RESERVATION_LIFECYCLE.md L2, L3).
 *
 * Only an override may leave the graph (L4); that decision belongs to the
 * service, which knows who is asking.
 */
export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to)
}
