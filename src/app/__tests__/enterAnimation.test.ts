import { describe, expect, it } from 'vitest'
import { enterAnimation, uaAnimatedKey } from '../enterAnimation'

describe('uaAnimatedKey', () => {
  it('returns the key of the entry the browser animated into', () => {
    expect(uaAnimatedKey({ state: { usr: null, key: 'abc', idx: 2 }, hasUAVisualTransition: true })).toBe('abc')
  })

  it('maps an entry without a key to "default", like React Router', () => {
    expect(uaAnimatedKey({ state: null, hasUAVisualTransition: true })).toBe('default')
    expect(uaAnimatedKey({ state: { idx: 0 }, hasUAVisualTransition: true })).toBe('default')
    expect(uaAnimatedKey({ state: { key: '' }, hasUAVisualTransition: true })).toBe('default')
  })

  it('returns null when the browser did not animate', () => {
    expect(uaAnimatedKey({ state: { key: 'abc' }, hasUAVisualTransition: false })).toBeNull()
  })

  it('returns null when the browser does not support the flag', () => {
    expect(uaAnimatedKey({ state: { key: 'abc' } })).toBeNull()
  })
})

describe('enterAnimation', () => {
  const base = { isFirst: false, locationKey: 'abc', uaAnimatedKey: null }

  it('goes forward on PUSH and back on POP', () => {
    expect(enterAnimation({ ...base, navigationType: 'PUSH' })).toBe('forward')
    expect(enterAnimation({ ...base, navigationType: 'POP' })).toBe('back')
  })

  it('does not animate the first screen or a REPLACE', () => {
    expect(enterAnimation({ ...base, isFirst: true, navigationType: 'POP' })).toBe('none')
    expect(enterAnimation({ ...base, navigationType: 'REPLACE' })).toBe('none')
  })

  it('skips a POP the browser has already animated', () => {
    expect(enterAnimation({ ...base, navigationType: 'POP', uaAnimatedKey: 'abc' })).toBe('none')
  })

  it('does not let the flag leak to another location', () => {
    expect(enterAnimation({ ...base, navigationType: 'POP', locationKey: 'xyz', uaAnimatedKey: 'abc' })).toBe('back')
    // A PUSH always creates a new key, but even a matching one is not a browser-animated step.
    expect(enterAnimation({ ...base, navigationType: 'PUSH', uaAnimatedKey: 'abc' })).toBe('forward')
  })
})
