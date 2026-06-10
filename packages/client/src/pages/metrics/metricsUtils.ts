export type OccupancyTier = 'high' | 'mid' | 'low'

const TIER_HIGH = 70
const TIER_MID = 40

/** Three-tier classification used for bar colours and strip CSS classes. */
export function occupancyTier(rate: number): OccupancyTier {
  if (rate >= TIER_HIGH) return 'high'
  if (rate >= TIER_MID) return 'mid'
  return 'low'
}

/** Format a euro revenue number as "12.3k" above 1000, otherwise "850". */
export function formatRevenue(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toFixed(0)
}

/** Locale-aware short month name for a 1-based month index (1 = January). */
export function monthLabel(monthIndex: number, locale: string): string {
  return new Date(2024, monthIndex - 1).toLocaleDateString(locale, { month: 'short' })
}

/**
 * Pad a partial month array to exactly 12 entries.
 * Any month not present in `source` is replaced by `defaultFactory(month, year)`.
 * `T` must carry a `month: number` field (1–12).
 */
export function fillMonths<T extends { month: number }>(
  source: T[],
  year: number,
  defaultFactory: (month: number, year: number) => T,
): T[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return source.find((d) => d.month === m) ?? defaultFactory(m, year)
  })
}
