import { describe, expect, it } from 'vitest'
import { TARE_SLIDER, tareGramsFromSlider, tareSliderPosition } from '../tare'

describe('tareSliderPosition', () => {
  it('keeps a weight inside the range as is, decimals too', () => {
    expect(tareSliderPosition(850)).toBe(850)
    expect(tareSliderPosition(212.5)).toBe(212.5)
  })

  it('clamps a weight outside the range', () => {
    expect(tareSliderPosition(4500)).toBe(TARE_SLIDER.max)
    expect(tareSliderPosition(3)).toBe(TARE_SLIDER.min)
    expect(tareSliderPosition(0)).toBe(TARE_SLIDER.min)
  })

  it('stands at the start while nothing is typed', () => {
    expect(tareSliderPosition(null)).toBe(TARE_SLIDER.min)
    expect(tareSliderPosition(Number.NaN)).toBe(TARE_SLIDER.min)
  })
})

describe('tareGramsFromSlider', () => {
  it.each([
    [850, 850],
    [854, 850],
    [855, 860],
    [1234.9, 1230],
  ])('%d → %d', (position, grams) => {
    expect(tareGramsFromSlider(position)).toBe(grams)
  })

  it('never leaves the range', () => {
    expect(tareGramsFromSlider(0)).toBe(TARE_SLIDER.min)
    expect(tareGramsFromSlider(-20)).toBe(TARE_SLIDER.min)
    expect(tareGramsFromSlider(9999)).toBe(TARE_SLIDER.max)
  })

  it('always gives a valid tare weight', () => {
    expect(tareGramsFromSlider(TARE_SLIDER.min)).toBeGreaterThan(0)
  })
})
