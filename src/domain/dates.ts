import type { CookedWeight, Id } from './types'

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** «сегодня», «вчера» or «12 окт.» in local time; `now` is passed in to keep the domain pure. */
export function dayLabel(at: string, now: Date): string {
  const date = new Date(at)
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return dayMonth.format(date)
}

/** «19:40» in local time: when a dish's cooked weight was typed. */
export function clockTime(at: string): string {
  return clock.format(new Date(at))
}

/**
 * A dish's last cooked weight, if it was typed today (local calendar day) in the tare the dish is
 * weighed in now; null — weigh again (docs/SPEC.md §3а). `now` is passed in to keep the domain pure.
 */
export function cookedToday(cooked: CookedWeight | null, tareId: Id | null, now: Date): number | null {
  if (!cooked || cooked.tareId !== tareId) return null
  return startOfDay(new Date(cooked.at)) === startOfDay(now) ? cooked.grams : null
}
