/** How many days of use a dish keeps in `usedOn` (docs/SPEC.md §3б «Меню блюд»). */
export const USED_DAYS_KEPT = 30

/** «Частые» count the distinct days of use within this many days, today included. */
export const FREQUENT_WINDOW_DAYS = 60

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** The local calendar day of a moment, «YYYY-MM-DD»: what `usedOn` holds. */
export function localDay(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Days since the epoch of a «YYYY-MM-DD» day; NaN for anything else. */
function dayNumber(day: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return NaN
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000
}

/**
 * The dish was used on `day` (typed a raw weight, tare or cooked weight in the calculator): the day is
 * added once, the days stay in order, only the last `USED_DAYS_KEPT` are kept. The same array when
 * the day is there already, so nothing is rewritten.
 */
export function markUsed(usedOn: readonly string[], day: string): string[] {
  if (usedOn.includes(day)) return usedOn as string[]
  return [...usedOn, day].sort().slice(-USED_DAYS_KEPT)
}

/** How many distinct days of `usedOn` fall within the last `FREQUENT_WINDOW_DAYS` days up to `today`. */
export function usesSince(usedOn: readonly string[], today: string): number {
  const end = dayNumber(today)
  const days = new Set(
    usedOn.filter((day) => {
      const age = end - dayNumber(day)
      return age >= 0 && age < FREQUENT_WINDOW_DAYS
    }),
  )
  return days.size
}

/** The latest day of use, «» if none: «YYYY-MM-DD» strings compare as dates. */
export function lastUsedDay(usedOn: readonly string[]): string {
  return usedOn.reduce((latest, day) => (day > latest ? day : latest), '')
}
