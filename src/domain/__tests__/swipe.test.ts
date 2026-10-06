import { describe, expect, it } from 'vitest'
import { rubberBand, settleDuration, settleSwipe, type SwipeLimits } from '../swipe'

const limits: SwipeLimits = { width: 360, openAtPx: 48, fullRatio: 0.5, flickVelocity: 0.5, canCopy: true }
const noCopy: SwipeLimits = { ...limits, canCopy: false }

describe('settleSwipe', () => {
  it('a short slow drag closes the row', () => {
    expect(settleSwipe(-30, 0.1, limits)).toBe('closed')
    expect(settleSwipe(30, -0.1, limits)).toBe('closed')
  })

  it('past the open threshold the row stays open on its action', () => {
    expect(settleSwipe(-60, 0, limits)).toBe('open-remove')
    expect(settleSwipe(60, 0, limits)).toBe('open-copy')
    expect(settleSwipe(-48, 0, limits)).toBe('open-remove')
  })

  it('past half the width the action is done', () => {
    expect(settleSwipe(-180, 0, limits)).toBe('remove')
    expect(settleSwipe(-300, 2, limits)).toBe('remove')
    expect(settleSwipe(180, 0, limits)).toBe('copy')
  })

  it('a flick finishes the motion it started', () => {
    expect(settleSwipe(-10, -0.8, limits)).toBe('open-remove')
    expect(settleSwipe(10, 0.8, limits)).toBe('open-copy')
  })

  it('an open row flicked back closes', () => {
    expect(settleSwipe(-90, 0.8, limits)).toBe('closed')
    expect(settleSwipe(90, -0.8, limits)).toBe('closed')
  })

  it('a flick alone never removes', () => {
    expect(settleSwipe(-150, -5, limits)).toBe('open-remove')
  })

  it('without copy the row does not open right', () => {
    expect(settleSwipe(60, 0, noCopy)).toBe('closed')
    expect(settleSwipe(10, 0.8, noCopy)).toBe('closed')
    expect(settleSwipe(200, 0, noCopy)).toBe('closed')
  })
})

describe('rubberBand', () => {
  it('follows the finger 1:1 within the range', () => {
    expect(rubberBand(-50, -360, 0, 104)).toBe(-50)
    expect(rubberBand(0, -360, 0, 104)).toBe(0)
  })

  it('resists past the end, less and less, never beyond the dimension', () => {
    const a = rubberBand(20, -360, 0, 104)
    const b = rubberBand(200, -360, 0, 104)
    expect(a).toBeGreaterThan(0)
    expect(a).toBeLessThan(20)
    expect(b).toBeGreaterThan(a)
    expect(b - a).toBeLessThan(180)
    expect(rubberBand(1e9, -360, 0, 104)).toBeLessThanOrEqual(104)
  })

  it('is symmetric at the lower end', () => {
    expect(rubberBand(-380, -360, 0, 104)).toBeCloseTo(-360 - rubberBand(20, -360, 0, 104))
  })
})

describe('settleDuration', () => {
  it('a slow release takes distance over the minimum speed, within the bounds', () => {
    expect(settleDuration(104, 0, 0.6, 150, 250)).toBe(173)
    expect(settleDuration(10, 0, 0.6, 150, 250)).toBe(150)
    expect(settleDuration(400, 0, 0.6, 150, 250)).toBe(250)
  })

  it('a fast flick is quicker, whatever its sign', () => {
    expect(settleDuration(300, -2, 0.6, 150, 250)).toBe(150)
    expect(settleDuration(-200, 1, 0.6, 150, 250)).toBe(200)
  })
})
