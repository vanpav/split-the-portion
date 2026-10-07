import { describe, expect, it } from 'vitest'
import {
  dishSwitchAnimation,
  enterAnimation,
  screenKey,
  settingsSwitchAnimation,
  shelfScrollTarget,
  uaAnimatedKey,
} from '../enterAnimation'

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

describe('screenKey', () => {
  it('maps every dish calculator to one screen', () => {
    expect(screenKey('/d/abc')).toBe('/d/:id')
    expect(screenKey('/d/xyz')).toBe(screenKey('/d/abc'))
    expect(screenKey('/d/abc/')).toBe('/d/:id')
  })

  it('keeps the dish form, a new dish and other screens apart', () => {
    expect(screenKey('/d/new')).toBe('/d/new')
    expect(screenKey('/d/abc/edit')).toBe('/d/abc/edit')
    expect(screenKey('/dishes')).toBe('/dishes')
    expect(screenKey('/')).toBe('/')
  })

  it('maps the settings and every subsection to one screen', () => {
    expect(screenKey('/settings')).toBe('/settings')
    expect(screenKey('/settings/tares')).toBe('/settings')
    expect(screenKey('/settings/companies/')).toBe('/settings')
  })

  it('keeps the screen under a screen opened over it, so it is not remounted', () => {
    expect(screenKey('/d/abc/tare/new')).toBe('/d/:id')
    expect(screenKey('/d/abc/company/new')).toBe('/d/:id')
    expect(screenKey('/d/abc/copy')).toBe('/d/:id')
    expect(screenKey('/d/abc/edit/from-dish')).toBe('/d/abc/edit')
    expect(screenKey('/d/new/from-dish')).toBe('/d/new')
    expect(screenKey('/settings/group/copy')).toBe('/settings')
  })

  it('does not take a short path that only ends like a screen over another for one', () => {
    expect(screenKey('/join')).toBe('/join')
    expect(screenKey('/d/copy')).toBe('/d/:id')
  })
})

describe('dishSwitchAnimation', () => {
  it('comes from the side of the tapped chip', () => {
    expect(dishSwitchAnimation({ from: 1, to: 3, navigationType: 'PUSH' })).toBe('forward')
    expect(dishSwitchAnimation({ from: 3, to: 0, navigationType: 'PUSH' })).toBe('back')
  })

  it('falls back to the navigation type when the dish is not switched by a chip', () => {
    expect(dishSwitchAnimation({ from: null, to: null, navigationType: 'PUSH' })).toBe('forward')
    expect(dishSwitchAnimation({ from: null, to: null, navigationType: 'POP' })).toBe('back')
    expect(dishSwitchAnimation({ from: null, to: null, navigationType: 'REPLACE' })).toBe('none')
  })

  it('falls back when the current dish is not on the shelf or the places are the same', () => {
    expect(dishSwitchAnimation({ from: null, to: 2, navigationType: 'PUSH' })).toBe('forward')
    expect(dishSwitchAnimation({ from: 2, to: 2, navigationType: 'POP' })).toBe('back')
  })
})

describe('settingsSwitchAnimation', () => {
  it('animates only the content when the menu replaces the subsection, by its place in the menu', () => {
    expect(settingsSwitchAnimation({ from: 0, to: 3, navigationType: 'REPLACE' })).toEqual({ page: 'none', content: 'forward' })
    expect(settingsSwitchAnimation({ from: 4, to: 1, navigationType: 'REPLACE' })).toEqual({ page: 'none', content: 'back' })
    expect(settingsSwitchAnimation({ from: 2, to: 2, navigationType: 'REPLACE' })).toEqual({ page: 'none', content: 'none' })
  })

  it('moves the whole page as between screens for a new entry and a step through history', () => {
    expect(settingsSwitchAnimation({ from: 0, to: 3, navigationType: 'PUSH' })).toEqual({ page: 'forward', content: 'none' })
    expect(settingsSwitchAnimation({ from: 3, to: 0, navigationType: 'POP' })).toEqual({ page: 'back', content: 'none' })
  })
})

describe('shelfScrollTarget', () => {
  const view = { scrollLeft: 100, width: 200, padStart: 16, padEnd: 32 }

  it('does not scroll when the chip is in sight', () => {
    expect(shelfScrollTarget({ ...view, itemStart: 116, itemEnd: 268 })).toBeNull()
    expect(shelfScrollTarget({ ...view, itemStart: 150, itemEnd: 200 })).toBeNull()
  })

  it('brings a chip on the left to the start, past the padding', () => {
    expect(shelfScrollTarget({ ...view, itemStart: 110, itemEnd: 160 })).toBe(94)
    expect(shelfScrollTarget({ ...view, itemStart: 5, itemEnd: 50 })).toBe(0)
  })

  it('brings a chip on the right to the end, past the padding', () => {
    expect(shelfScrollTarget({ ...view, itemStart: 250, itemEnd: 300 })).toBe(132)
    expect(shelfScrollTarget({ ...view, itemStart: 1000, itemEnd: 1050 })).toBe(882)
  })

  it('shows the start of a chip wider than the view', () => {
    expect(shelfScrollTarget({ ...view, itemStart: 300, itemEnd: 600 })).toBe(284)
  })
})
