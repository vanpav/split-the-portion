import type { Locale } from './numbers'
import type { CookedWeight, Id } from './types'

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** «7 окт.» (`ru-RU`), «Oct 7» (`en-US`) in local time: when a passkey was added, an invite expires. */
export function shortDate(at: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(at))
}

/** Whether `at` falls on the same local calendar day as `now`. */
export function sameDay(at: string, now: Date): boolean {
  return startOfDay(new Date(at)) === startOfDay(now)
}

/** «19:40» in local time: when a dish's cooked weight was typed, the last sync. */
export function clockTime(at: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(at))
}

/**
 * A dish's last cooked weight, if it was typed today (local calendar day) in the tare the dish is
 * weighed in now; null — weigh again (docs/SPEC.md §3а). `now` is passed in to keep the domain pure.
 */
export function cookedToday(cooked: CookedWeight | null, tareId: Id | null, now: Date): number | null {
  if (!cooked || cooked.tareId !== tareId) return null
  return sameDay(cooked.at, now) ? cooked.grams : null
}
