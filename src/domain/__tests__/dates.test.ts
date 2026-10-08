import { describe, expect, it } from 'vitest'
import { clockTime, cookedToday, sameDay, shortDate } from '../dates'

// Local times, as the phone shows them: the tests hold in any time zone.
const local = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString()

describe('cookedToday', () => {
  const now = new Date(2026, 9, 6, 20, 15)
  const cooked = { grams: 186, tareId: null, at: local(6, 19, 40) }

  it('today in the same tare: the weight', () => {
    expect(cookedToday(cooked, null, now)).toBe(186)
    expect(cookedToday({ ...cooked, at: local(6, 0, 5) }, null, now)).toBe(186)
  })

  it('yesterday, in another tare or never weighed: null', () => {
    expect(cookedToday({ ...cooked, at: local(5, 23, 50) }, null, now)).toBeNull()
    expect(cookedToday(cooked, 'pot', now)).toBeNull()
    expect(cookedToday({ ...cooked, tareId: 'pot' }, null, now)).toBeNull()
    expect(cookedToday(null, null, now)).toBeNull()
  })
})

describe('clockTime', () => {
  it('hours and minutes, two digits each', () => {
    expect(clockTime(local(6, 19, 40), 'ru-RU')).toBe('19:40')
    expect(clockTime(local(6, 9, 5), 'ru-RU')).toBe('09:05')
  })
})

describe('sameDay', () => {
  const now = new Date(2026, 9, 6, 0, 30)

  it('the local calendar day, not the last 24 hours', () => {
    expect(sameDay(local(6, 0, 0), now)).toBe(true)
    expect(sameDay(local(5, 23, 59), now)).toBe(false)
    expect(sameDay(local(7, 0, 0), now)).toBe(false)
  })
})

describe('shortDate', () => {
  it('formats a local day and short month', () => {
    expect(shortDate(new Date(2026, 9, 7, 23, 59), 'ru-RU')).toBe('7 окт.')
  })

  it('accepts an ISO string', () => {
    expect(shortDate(new Date(2026, 0, 15, 12).toISOString(), 'ru-RU')).toBe('15 янв.')
  })
})
