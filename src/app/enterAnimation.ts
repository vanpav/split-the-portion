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

/**
 * Which screen a path shows, for keying the screen transition: the same screen keeps its element,
 * so it neither remounts nor animates. Every dish's calculator (`/d/:id`) is one screen — switching
 * dishes on the shelf keeps the shelf in place, only the calculator under it changes
 * (docs/UX.md «Переходы между экранами»). Any other path is its own screen.
 */
export function screenKey(pathname: string): string {
  const parts = pathname.split('/').filter((part) => part !== '')
  return parts.length === 2 && parts[0] === 'd' && parts[1] !== 'new' ? '/d/:id' : pathname
}

/**
 * How the calculator under the shelf comes in when the dish changes on the same screen
 * (docs/UX.md «Переходы между экранами»). A chip tapped on the shelf: from its side — a chip to the
 * right of the current one comes from the right, to the left from the left (`from` and `to` are
 * the chips' places in the shelf as shown at the tap). Otherwise (search, the dish menu, history
 * «назад» / «вперёд») as between screens: PUSH from the right, POP from the left, REPLACE none.
 */
export function dishSwitchAnimation(input: {
  from: number | null
  to: number | null
  navigationType: `${NavigationType}`
}): EnterAnimation {
  const { from, to } = input
  if (from !== null && to !== null && from !== to) return to > from ? 'forward' : 'back'
  if (input.navigationType === 'REPLACE') return 'none'
  return input.navigationType === 'POP' ? 'back' : 'forward'
}

/**
 * Where to scroll the dish shelf so the current chip is in sight, or `null` when it already is.
 * Like `scrollIntoView({ inline: 'nearest' })`, but for the shelf alone: a smooth `scrollIntoView`
 * also scrolls the page and is cut short by the page's own scroll on navigation. Positions are in
 * the shelf's content coordinates; `padStart` / `padEnd` keep the chip clear of the faded edges.
 */
export function shelfScrollTarget(input: {
  scrollLeft: number
  width: number
  itemStart: number
  itemEnd: number
  padStart: number
  padEnd: number
}): number | null {
  const { scrollLeft, width, itemStart, itemEnd, padStart, padEnd } = input
  const viewStart = scrollLeft + padStart
  const viewEnd = scrollLeft + width - padEnd
  // Wider than the view: its start in sight.
  if (itemStart < viewStart || itemEnd - itemStart > viewEnd - viewStart) return Math.max(0, itemStart - padStart)
  if (itemEnd > viewEnd) return itemEnd - width + padEnd
  return null
}
