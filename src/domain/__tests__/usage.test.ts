import { describe, expect, it } from 'vitest'
import { FREQUENT_WINDOW_DAYS, lastUsedDay, localDay, markUsed, USED_DAYS_KEPT, usesSince } from '../usage'

describe('localDay', () => {
  it('is the local calendar day, zero-padded', () => {
    expect(localDay(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
    expect(localDay(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-31')
  })
})

describe('markUsed', () => {
  it('adds the day once: several weights typed in a day are one use', () => {
    const once = markUsed([], '2026-10-05')
    expect(once).toEqual(['2026-10-05'])
    expect(markUsed(once, '2026-10-05')).toBe(once)
  })

  it('keeps the days in order', () => {
    expect(markUsed(['2026-10-05'], '2026-10-01')).toEqual(['2026-10-01', '2026-10-05'])
  })

  it(`keeps the last ${USED_DAYS_KEPT} days`, () => {
    const days = Array.from({ length: USED_DAYS_KEPT }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`)
    const next = markUsed(days, '2026-10-01')
    expect(next).toHaveLength(USED_DAYS_KEPT)
    expect(next[0]).toBe('2026-09-02')
    expect(next.at(-1)).toBe('2026-10-01')
  })
})

describe('usesSince', () => {
  it(`counts distinct days within the last ${FREQUENT_WINDOW_DAYS} days, today included`, () => {
    // 2026-08-08 is 59 days before 2026-10-06; 2026-08-07 is 60.
    expect(usesSince(['2026-08-07', '2026-08-08', '2026-10-01', '2026-10-06'], '2026-10-06')).toBe(3)
  })

  it('ignores repeats, days after today and broken values', () => {
    expect(usesSince(['2026-10-05', '2026-10-05', '2026-10-07', 'nope'], '2026-10-06')).toBe(1)
  })

  it('crosses months and years', () => {
    expect(usesSince(['2025-12-31', '2026-01-01'], '2026-01-02')).toBe(2)
  })
})

describe('lastUsedDay', () => {
  it('is the latest day, empty with none', () => {
    expect(lastUsedDay(['2026-10-01', '2026-10-05', '2026-09-30'])).toBe('2026-10-05')
    expect(lastUsedDay([])).toBe('')
  })
})
