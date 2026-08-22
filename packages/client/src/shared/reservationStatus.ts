import type { ReservationStatus } from '../api/client'

/**
 * The client-side mirror of the server's lifecycle rules
 * (`packages/server/src/domain/reservationStatus.ts`).
 *
 * It exists so the UI can show only the transitions that will be accepted, per
 * docs/UX.md §3 — a dropdown of all five states invites illegal choices and then
 * rejects them, which teaches the user that the UI is lying. The server remains
 * the authority: this is a courtesy, never an enforcement.
 */
export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'Confirmed',
  'CheckedIn',
  'CheckedOut',
  'Cancelled',
  'NoShow',
]

const HOLDS_DATES: readonly ReservationStatus[] = ['Confirmed', 'CheckedIn', 'CheckedOut']

const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  Confirmed: ['CheckedIn', 'Cancelled', 'NoShow'],
  CheckedIn: ['CheckedOut'],
  CheckedOut: [],
  Cancelled: [],
  NoShow: [],
}

/**
 * Whether the reservation occupies its dates.
 *
 * Every "is this listing busy" question in the UI goes through this, so a
 * cancelled or no-show stay reads as free space everywhere at once — the
 * calendar, the dashboard counts and the arrival lists cannot drift apart.
 */
export function holdsDates(status: ReservationStatus): boolean {
  return HOLDS_DATES.includes(status)
}

export function allowedTransitions(status: ReservationStatus): readonly ReservationStatus[] {
  return TRANSITIONS[status]
}

/** i18n key for a status label, e.g. `reservations.status.CheckedIn`. */
export function statusLabelKey(status: ReservationStatus): string {
  return `reservations.status.${status}`
}

/** i18n key for the action that moves *into* a status, e.g. "Check in". */
export function transitionLabelKey(status: ReservationStatus): string {
  return `reservations.transition.${status}`
}

/**
 * Modifier for the status badge. Paired with an icon in the template, never
 * relied on alone — see docs/UX.md §3.
 */
export function statusModifier(status: ReservationStatus): string {
  return `badge--status-${status.toLowerCase()}`
}

export function statusIconName(status: ReservationStatus): string {
  switch (status) {
    case 'Confirmed':
      return 'calendar'
    case 'CheckedIn':
      return 'log-in'
    case 'CheckedOut':
      return 'log-out'
    case 'Cancelled':
      return 'x'
    case 'NoShow':
      return 'info-circle'
  }
}
