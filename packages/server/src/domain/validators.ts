export function stripTime(isoString: string): string {
  const t = isoString.indexOf('T')
  return t === -1 ? isoString : isoString.slice(0, t)
}

export function isValidDateRange(fromDate: string, toDate: string): boolean {
  return Date.parse(toDate) > Date.parse(fromDate)
}

export function meetsMinNights(fromDate: string, toDate: string, minNights: number): boolean {
  const nights = (Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000
  return nights >= minNights
}

/**
 * Canonical form of a username, for lookups and uniqueness checks.
 *
 * Accounts migrated from the old MongoDB app were stored capitalized
 * (`Isabel`, `Andreu`) and were rewritten lowercase during the migration, so an
 * exact-match lookup rejected everyone who typed their name the way they always
 * had. Comparing the normalized form makes the spelling irrelevant; the stored
 * spelling is still what gets returned to the caller.
 *
 * Trimming matters too: mobile keyboards happily append a space after
 * autocompleting a username.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}
