/**
 * Today as YYYY-MM-DD in the *local* timezone.
 *
 * `new Date().toISOString().split('T')[0]` returns the UTC date, which in
 * Brazil (UTC-3) is already tomorrow after 21:00 local time. It must also be
 * called per render, not once at module load, or the value goes stale when the
 * tab stays open past midnight.
 */
export function todayLocal(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Local midnight for a YYYY-MM-DD string. */
export function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function isOverdue(prazo: string): boolean {
  if (!prazo) return false
  return parseLocalDate(prazo) < parseLocalDate(todayLocal())
}
