import { describe, expect, it } from 'vitest'
import { clockTime, cookedToday } from '../dates'

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
    expect(clockTime(local(6, 19, 40))).toBe('19:40')
    expect(clockTime(local(6, 9, 5))).toBe('09:05')
  })
})
