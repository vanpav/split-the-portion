import { describe, expect, it } from 'vitest'
import {
  cardDone,
  cardShown,
  EMPTY_HINTS,
  finishTour,
  finishWelcome,
  hintsAgain,
  pickCard,
  readHints,
  settleHints,
  showWelcome,
  SHOWS_PER_CARD,
  skipHints,
  tourAt,
  tourFrom,
  tourSteps,
  type CardPlace,
  type HintPrefs,
} from '../hints'

const after = (hints: HintPrefs, ...steps: ((h: HintPrefs) => HintPrefs)[]) => steps.reduce((h, step) => step(h), hints)
const calculator: CardPlace = { place: 'calculator', safari: false, portions: true, shownNow: [] }
const toured = finishTour(EMPTY_HINTS)

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
    expect(tourFrom(toured)).toBeNull()
  })

  it('«Пропустить» turns everything off and keeps the step for «Вернуть»', () => {
    const before = tourAt(EMPTY_HINTS, 1)
    const skipped = skipHints(before)
    expect(tourFrom(skipped)).toBeNull()
    expect(pickCard(skipped, { ...calculator, safari: true })).toBeNull()
    expect(skipped.tour).toBe(1)
  })

  it('«Показать заново» starts the tour over and brings the cards back, the welcome stays gone through', () => {
    const used = after(EMPTY_HINTS, finishWelcome, finishTour, skipHints, (h) => cardDone(h, 'copy'), (h) => cardShown(h, 'install'))
    const again = hintsAgain(used)
    expect(again).toEqual({ ...EMPTY_HINTS, welcome: true })
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

describe('cards in place', () => {
  it('wait for the tour on the calculator, not on the dish list', () => {
    expect(pickCard(EMPTY_HINTS, calculator)).toBeNull()
    expect(pickCard(EMPTY_HINTS, { ...calculator, place: 'dishes', safari: true })).toBe('install')
    expect(pickCard(toured, calculator)).toBe('copy')
  })

  it('one at a time: «На экран „Домой“» first, then the copy one', () => {
    expect(pickCard(toured, { ...calculator, safari: true })).toBe('install')
    expect(pickCard(cardDone(toured, 'install'), { ...calculator, safari: true })).toBe('copy')
  })

  it('copy only where portions are shown', () => {
    expect(pickCard(toured, { ...calculator, portions: false })).toBeNull()
    expect(pickCard(toured, { ...calculator, place: 'dishes' })).toBeNull()
  })

  it('a card dismissed or done is gone', () => {
    expect(pickCard(cardDone(toured, 'copy'), calculator)).toBeNull()
    expect(cardDone(cardDone(toured, 'copy'), 'copy').done).toEqual(['copy'])
  })

  it(`after ${SHOWS_PER_CARD} launches a card is gone, but not in the launch that counted it`, () => {
    let hints = toured
    for (let i = 0; i < SHOWS_PER_CARD; i++) hints = cardShown(hints, 'copy')
    expect(pickCard(hints, calculator)).toBeNull()
    expect(pickCard(hints, { ...calculator, shownNow: ['copy'] })).toBe('copy')
  })
})

describe('readHints', () => {
  it('keeps what is valid, drops the rest', () => {
    const stored = { settled: true, off: false, welcome: true, tour: 2, done: ['copy', 'copy', 'x'], shown: { install: 2, copy: 0, y: 1 } }
    expect(readHints(stored)).toEqual({ settled: true, off: false, welcome: true, tour: 2, done: ['copy'], shown: { install: 2 } })
    expect(readHints({ tour: 'done' }).tour).toBe('done')
    expect(readHints({ tour: -1 }).tour).toBe(0)
    expect(readHints(null)).toEqual(EMPTY_HINTS)
    expect(readHints([])).toEqual(EMPTY_HINTS)
  })
})
