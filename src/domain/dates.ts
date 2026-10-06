const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** «сегодня», «вчера» or «12 окт.» in local time; `now` is passed in to keep the domain pure. */
export function dayLabel(at: string, now: Date): string {
  const date = new Date(at)
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return dayMonth.format(date)
}
