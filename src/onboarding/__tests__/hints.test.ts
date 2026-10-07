import { describe, expect, it } from 'vitest'
import {
  EMPTY_HINTS,
  finishTour,
  finishWelcome,
  hintsAgain,
  readHints,
  setHintsOff,
  settleHints,
  showWelcome,
  skipHints,
  tourAt,
  tourFrom,
  tourSteps,
} from '../hints'

describe('first launch', () => {
  it('a new device gets the welcome and the tour', () => {
    const hints = settleHints(EMPTY_HINTS, false)
    expect(hints.settled).toBe(true)
    expect(showWelcome(hints, false)).toBe(true)
    expect(tourFrom(hints)).toBe(0)
  })

  it('a device that already has dishes goes past both, once', () => {
    const hints = settleHints(EMPTY_HINTS, true)
    expect(showWelcome(hints, false)).toBe(false)
    expect(tourFrom(hints)).toBeNull()
    // Settled: dishes coming later (a group joined) do not change it again.
    const fresh = settleHints(EMPTY_HINTS, false)
    expect(settleHints(fresh, true)).toBe(fresh)
  })

  it('the welcome is for a device without dishes, until it is gone through', () => {
    expect(showWelcome(EMPTY_HINTS, true)).toBe(false)
    expect(showWelcome(finishWelcome(EMPTY_HINTS), false)).toBe(false)
  })
})

describe('the tour', () => {
  it('goes on from the step it stopped at, until done', () => {
    expect(tourFrom(tourAt(EMPTY_HINTS, 2))).toBe(2)
    expect(tourFrom(finishTour(EMPTY_HINTS))).toBeNull()
  })

  it('«Пропустить» turns it off and keeps the step for «Вернуть»', () => {
    const before = tourAt(EMPTY_HINTS, 1)
    const skipped = skipHints(before)
    expect(tourFrom(skipped)).toBeNull()
    expect(skipped.tour).toBe(1)
    expect(tourFrom(setHintsOff(skipped, false))).toBe(1)
  })

  it('«Показать заново» starts the tour over, the welcome stays gone through', () => {
    const used = skipHints(finishTour(finishWelcome(EMPTY_HINTS)))
    expect(hintsAgain(used)).toEqual({ ...EMPTY_HINTS, welcome: true })
  })

  it('a simple dish says «Сухой», a composite one «Сырой»; with people the bar is shown', () => {
    const simple = tourSteps({ composite: false, people: false })
    expect(simple.map((s) => s.target)).toEqual(['tiles', 'tare', 'who', 'shelf'])
    expect(simple[0].text).toContain('<b>Сухой</b>')
    const composite = tourSteps({ composite: true, people: true })
    expect(composite[0].text).toContain('<b>Сырой</b>')
    expect(composite.map((s) => s.target)).toEqual(['tiles', 'tare', 'bar', 'shelf'])
  })
})

describe('readHints', () => {
  it('keeps what is valid, drops the rest', () => {
    // Fields of earlier builds (the cards in place) are dropped.
    const stored = { settled: true, off: false, welcome: true, tour: 2, done: ['copy'], shown: { install: 2 } }
    expect(readHints(stored)).toEqual({ settled: true, off: false, welcome: true, tour: 2 })
    expect(readHints({ tour: 'done' }).tour).toBe('done')
    expect(readHints({ tour: -1 }).tour).toBe(0)
    expect(readHints(null)).toEqual(EMPTY_HINTS)
    expect(readHints([])).toEqual(EMPTY_HINTS)
  })
})
