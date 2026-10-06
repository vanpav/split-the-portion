import type { NavigationType } from 'react-router'

/** The part of a `popstate` event the transition reads; a plain object in tests. */
export type PopStateLike = {
  state: unknown
  /** `undefined` where the browser does not support it: then nothing changes. */
  hasUAVisualTransition?: boolean
}

/**
 * The history key of the entry the browser has itself animated into (e.g. the edge swipe «назад»
 * in iOS Safari), or `null`. `popstate` fires before React Router updates the location; the key ties
 * the flag to exactly that navigation: only a POP location with this key skips our animation.
 * Mirrors React Router's history: an entry without a key in its state is the page's first, "default".
 */
export function uaAnimatedKey(event: PopStateLike): string | null {
  if (event.hasUAVisualTransition !== true) return null
  const state = event.state
  const key = typeof state === 'object' && state !== null && 'key' in state ? state.key : undefined
  return typeof key === 'string' && key !== '' ? key : 'default'
}

export type EnterAnimation = 'none' | 'forward' | 'back'

/**
 * How the entering screen appears (docs/UX.md «Переходы между экранами»): PUSH goes deeper
 * (from the right), POP goes back (from the left). The page's first screen, a REPLACE and a POP
 * the browser has already animated itself do not animate.
 */
export function enterAnimation(input: {
  isFirst: boolean
  navigationType: `${NavigationType}`
  locationKey: string
  uaAnimatedKey: string | null
}): EnterAnimation {
  if (input.isFirst || input.navigationType === 'REPLACE') return 'none'
  if (input.navigationType === 'POP') return input.locationKey === input.uaAnimatedKey ? 'none' : 'back'
  return 'forward'
}
