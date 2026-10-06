/**
 * Swipe of a list row (docs/UX.md, «Свайпы строк»): where the row goes when the finger lets go, how it
 * resists past its ends and how long the snap takes. Pure numbers — the component only paints them.
 * Offsets are in px: negative — the row moved left (remove), positive — right (copy).
 */

/** Where a released row goes. */
export type SwipeSettle = 'closed' | 'open-remove' | 'open-copy' | 'remove' | 'copy'

export interface SwipeLimits {
  /** Width of the row. */
  width: number
  /** Released past this, the row stays open on its action. */
  openAtPx: number
  /** Released past this part of the width, the action is done at once. */
  fullRatio: number
  /** A flick at least this fast (px/ms) goes its way whatever the distance. */
  flickVelocity: number
  /** The row goes right, to «Копировать». */
  canCopy: boolean
}

/**
 * Where the row goes on release. `velocity` is signed, px/ms: a flick finishes the motion it started —
 * opens the action, or closes an open row flicked back. Only distance does the action itself, so a
 * flick never removes by accident.
 */
export function settleSwipe(offset: number, velocity: number, limits: SwipeLimits): SwipeSettle {
  const full = limits.width * limits.fullRatio
  if (offset <= -full) return 'remove'
  if (limits.canCopy && offset >= full) return 'copy'
  if (Math.abs(velocity) >= limits.flickVelocity) {
    if (velocity < 0) return offset > 0 ? 'closed' : 'open-remove'
    return offset < 0 || !limits.canCopy ? 'closed' : 'open-copy'
  }
  if (offset <= -limits.openAtPx) return 'open-remove'
  if (limits.canCopy && offset >= limits.openAtPx) return 'open-copy'
  return 'closed'
}

/** How hard the row pulls back past its end: 0 — a wall, 1 — no resistance. */
const RUBBER_BAND = 0.55

/**
 * The finger's offset as the row shows it: 1:1 between `min` and `max`, past them it moves less and less
 * (the iOS rubber band), never more than `dimension` beyond the end.
 */
export function rubberBand(offset: number, min: number, max: number, dimension: number): number {
  if (offset >= min && offset <= max) return offset
  const edge = offset < min ? min : max
  const over = Math.abs(offset - edge)
  const pulled = (1 - 1 / ((over * RUBBER_BAND) / dimension + 1)) * dimension
  return edge + Math.sign(offset - edge) * pulled
}

/**
 * Milliseconds for the row to cover `distance` px after release: as fast as the finger went (but no
 * slower than `minSpeed` px/ms), kept within `minMs`..`maxMs` so it is neither a jump nor a crawl.
 */
export function settleDuration(distance: number, velocity: number, minSpeed: number, minMs: number, maxMs: number): number {
  const speed = Math.max(Math.abs(velocity), minSpeed)
  return Math.round(Math.min(maxMs, Math.max(minMs, Math.abs(distance) / speed)))
}
