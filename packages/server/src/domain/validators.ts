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
