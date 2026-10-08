import { useDrag } from '@use-gesture/react'
import { CopyIcon, Trash2Icon } from 'lucide-react'
import { useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { Button } from '@/components/ui/button'
import { rubberBand, settleDuration, settleSwipe, type SwipeSettle } from '@/domain'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

/** Dragged less than this and let go slowly, the row slides back. */
const OPEN_AT_PX = 48
/** How far an open row stays moved: the width of its action. */
const ACTION_PX = 104
/** Dragged past this part of the row's width and let go, the action is done at once. */
const FULL_SWIPE_RATIO = 0.5
/** A flick at least this fast (px/ms) opens or closes the row whatever the distance. */
const FLICK_VELOCITY = 0.5
/** A slow release still settles at least this fast (px/ms). */
const SNAP_MIN_SPEED = 0.6
/** Bounds of a snap after release: short, never a jump, never a crawl. */
const SNAP_MIN_MS = 150
const SNAP_MAX_MS = 250
/** A removed row folds up this long; a row put back by «Отменить» unfolds as long. */
const COLLAPSE_MS = 200
const EXPAND_MS = 200
/** A row removed this long ago and back again is an undo: it unfolds. Longer than the toast lives. */
const RESTORE_WINDOW_MS = 10_000
/** After `onRemove`, a row still here this much later was kept by the list: it comes back. */
const KEPT_CHECK_MS = 100
/** The action under the row: from this scale while it shows, a bit larger once a release would do it. */
const ACTION_MIN_SCALE = 0.7
const ACTION_ARMED_SCALE = 1.15
/** Ease-out: quick start where the finger left off, soft landing. */
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'

/** The one open row: opening another closes it. */
let openRow: { owner: object; close: () => void } | null = null
const closeOtherRows = (owner: object) => {
  if (openRow && openRow.owner !== owner) openRow.close()
}
const claimOpenRow = (owner: object, close: () => void) => {
  closeOtherRows(owner)
  openRow = { owner, close }
}
const releaseOpenRow = (owner: object) => {
  if (openRow?.owner === owner) openRow = null
}
/** Items removed by a row, by id, with when: a row mounted again soon after is an undo. */
const removedAt = new Map<string, number>()

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The item as it stands and as it is gone: no height, padding, border or gap to its neighbour, so the
 * rows below move up smoothly instead of jumping when it leaves the DOM.
 */
function collapseFrames(item: HTMLElement): [Keyframe, Keyframe] {
  const style = getComputedStyle(item)
  const parent = item.parentElement && getComputedStyle(item.parentElement)
  const gap = parent && /flex|grid/.test(parent.display) ? parseFloat(parent.rowGap) || 0 : 0
  const side = item.nextElementSibling ? 'marginBottom' : item.previousElementSibling ? 'marginTop' : null
  const shown: Keyframe = {
    height: `${item.offsetHeight}px`,
    opacity: 1,
    paddingTop: style.paddingTop,
    paddingBottom: style.paddingBottom,
    borderTopWidth: style.borderTopWidth,
    borderBottomWidth: style.borderBottomWidth,
  }
  const gone: Keyframe = {
    height: '0px',
    opacity: 0,
    paddingTop: '0px',
    paddingBottom: '0px',
    borderTopWidth: '0px',
    borderBottomWidth: '0px',
  }
  if (side) {
    shown[side] = style[side]
    gone[side] = `${parseFloat(style[side]) - gap}px`
  }
  return [shown, gone]
}

export interface SwipeRowHandle {
  /** Remove the row as a swipe does: it slides out, folds up, then `onRemove`. For the row's own × button. */
  remove: () => void
}

interface SwipeRowProps {
  /** Swipe left: the red «Убрать» underneath; a full swipe removes at once (the caller offers «Отменить»). */
  onRemove: () => void
  /** Swipe right: «Копировать» underneath; a full swipe copies. Absent or null — the row does not go right. */
  onCopy?: (() => void) | null
  /** The element the row is: a list item in a list. It is what folds up on removal. */
  as?: 'li' | 'div'
  /** Classes of the moving row (padding, layout); it is opaque, so the actions stay hidden under it. */
  className?: string
  /** The item's id: removed here and put back by «Отменить», the row unfolds instead of popping in. */
  itemId?: string
  ref?: Ref<SwipeRowHandle>
  children: ReactNode
}

/**
 * A row that is swiped on a touch screen (phone, iPad): left — remove, right — copy. The row follows the
 * finger 1:1 (transform set directly, no re-render per frame), resists past its ends, and on release
 * snaps open, closed or out with a short ease-out as fast as the finger went. A removed row slides out
 * and folds up; with reduced motion every state is instant. With a mouse nothing moves: the row's own
 * buttons do it (hidden on a touch screen by the caller with `pointer-coarse:sr-only`, still there for
 * the keyboard and a screen reader) — and removal through `ref.remove()` folds up the same way.
 */
export function SwipeRow({ onRemove, onCopy, as: Tag = 'div', className, itemId, ref, children }: SwipeRowProps) {
  // Swipes are for fingers: a phone or an iPad, whatever its width.
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [owner] = useState(() => ({}))
  const itemRef = useRef<HTMLElement | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const removeRef = useRef<HTMLButtonElement>(null)
  const removeIconRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLButtonElement>(null)
  const copyIconRef = useRef<HTMLSpanElement>(null)
  /** Where the row is (or is going), px. */
  const x = useRef(0)
  /** Where the row was when the finger came down. */
  const from = useRef(0)
  const width = useRef(0)
  const leaving = useRef(false)
  const mounted = useRef(false)

  const paintAction = (button: HTMLElement | null, icon: HTMLElement | null, offset: number, ms: number) => {
    if (!button || !icon) return
    const shown = Math.min(1, Math.abs(offset) / ACTION_PX)
    const armed = width.current > 0 && Math.abs(offset) >= width.current * FULL_SWIPE_RATIO
    button.style.transition = ms > 0 ? `opacity ${ms}ms ${EASE_OUT}` : 'none'
    button.style.opacity = String(shown)
    button.style.pointerEvents = shown > 0 ? 'auto' : 'none'
    icon.style.transform = `scale(${armed ? ACTION_ARMED_SCALE : ACTION_MIN_SCALE + (1 - ACTION_MIN_SCALE) * shown})`
  }

  /** Moves the row and its actions; `ms` 0 — at once (under the finger). */
  const paint = (offset: number, ms: number) => {
    x.current = offset
    const row = rowRef.current
    if (row) {
      row.style.transition = ms > 0 ? `transform ${ms}ms ${EASE_OUT}, opacity ${ms}ms ${EASE_OUT}` : 'none'
      row.style.transform = offset === 0 ? '' : `translateX(${offset}px)`
    }
    paintAction(removeRef.current, removeIconRef.current, Math.min(offset, 0), ms)
    paintAction(copyRef.current, copyIconRef.current, Math.max(offset, 0), ms)
  }

  const settled = () => {
    if (rowRef.current) rowRef.current.style.willChange = ''
  }

  const claim = () => claimOpenRow(owner, () => snapTo(0, 0))
  const release = () => releaseOpenRow(owner)

  const snapTo = (offset: number, velocity: number) => {
    const distance = offset - x.current
    const ms = distance === 0 || reducedMotion()
      ? 0
      : settleDuration(distance, velocity, SNAP_MIN_SPEED, SNAP_MIN_MS, SNAP_MAX_MS)
    paint(offset, ms)
    if (ms === 0) settled()
    if (offset === 0) release()
    else claim()
  }

  const removed = (animation?: Animation) => {
    onRemove()
    // Still here a moment later — the list kept the item: the row comes back as it was.
    window.setTimeout(() => {
      if (!mounted.current) return
      animation?.cancel()
      leaving.current = false
      if (rowRef.current) rowRef.current.style.opacity = ''
      paint(0, 0)
      settled()
    }, KEPT_CHECK_MS)
  }

  /** Slides the row out to the left, folds the item up, then removes it. */
  const leave = (velocity: number) => {
    if (leaving.current) return
    leaving.current = true
    release()
    if (itemId !== undefined) removedAt.set(itemId, Date.now())
    const item = itemRef.current
    const row = rowRef.current
    if (!item || !row || reducedMotion()) return removed()
    const w = row.offsetWidth
    const ms = settleDuration(w + x.current, velocity, SNAP_MIN_SPEED, SNAP_MIN_MS, SNAP_MAX_MS)
    row.style.willChange = 'transform, opacity'
    paint(-w, ms)
    // With a mouse there is no action under the row: it fades as it goes.
    if (!touch) row.style.opacity = '0'
    window.setTimeout(() => {
      const animation = item.animate(collapseFrames(item), { duration: COLLAPSE_MS, easing: EASE_IN_OUT, fill: 'forwards' })
      void animation.finished.catch(() => undefined).then(() => removed(animation))
    }, ms)
  }

  const finish = (settle: SwipeSettle, velocity: number) => {
    if (settle === 'remove') return leave(velocity)
    if (settle === 'copy') {
      onCopy?.()
      return snapTo(0, velocity)
    }
    snapTo(settle === 'open-remove' ? -ACTION_PX : settle === 'open-copy' ? ACTION_PX : 0, velocity)
  }

  useImperativeHandle(ref, () => ({ remove: () => leave(0) }))

  // On mount: a row put back by «Отменить» unfolds where it was.
  useLayoutEffect(() => {
    mounted.current = true
    const item = itemRef.current
    const at = itemId === undefined ? undefined : removedAt.get(itemId)
    if (itemId !== undefined) removedAt.delete(itemId)
    if (item && at !== undefined && Date.now() - at < RESTORE_WINDOW_MS && !reducedMotion()) {
      const [shown, gone] = collapseFrames(item)
      item.animate([gone, shown], { duration: EXPAND_MS, easing: EASE_OUT })
    }
    return () => {
      mounted.current = false
      releaseOpenRow(owner)
    }
    // Both are fixed for a mounted row: this runs once per mount.
  }, [itemId, owner])

  const bind = useDrag(
    ({ first, active, tap, movement: [mx], velocity: [vx], direction: [dx], cancel, event }) => {
      if (leaving.current) return cancel()
      // A slider in the row moves its thumb, not the row.
      if (event.target instanceof Element && event.target.closest('[role="slider"]')) return cancel()
      if (tap) {
        closeOtherRows(owner)
        return snapTo(0, 0)
      }
      const row = rowRef.current
      if (!row) return
      if (first) {
        width.current = Math.max(row.offsetWidth, ACTION_PX * 2)
        // Caught mid-snap: go on from where the row is on screen, not where it was heading.
        from.current = new DOMMatrixReadOnly(getComputedStyle(row).transform).m41
        row.style.willChange = 'transform'
        claim()
      }
      const offset = rubberBand(from.current + mx, -width.current, onCopy ? width.current : 0, ACTION_PX)
      if (active) return paint(offset, 0)
      const settle = settleSwipe(offset, vx * dx, {
        width: width.current,
        openAtPx: OPEN_AT_PX,
        fullRatio: FULL_SWIPE_RATIO,
        flickVelocity: FLICK_VELOCITY,
        canCopy: Boolean(onCopy),
      })
      finish(settle, vx)
    },
    // Vertical first — the page scrolls and the row stays put.
    { enabled: touch, axis: 'x', filterTaps: true },
  )

  // Only for the finger: the keyboard and a screen reader use the row's own buttons.
  const action = 'pointer-events-none absolute inset-0 h-full rounded-none p-0 opacity-0'
  const actionLabel = 'flex flex-col items-center gap-1 text-xs transition-transform duration-150 ease-out motion-reduce:transition-none'

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        itemRef.current = el
      }}
      className="relative overflow-hidden"
    >
      {touch && onCopy && (
        <Button
          ref={copyRef}
          tabIndex={-1}
          aria-hidden
          className={cn(action, 'justify-start')}
          onClick={() => {
            onCopy()
            snapTo(0, 0)
          }}
        >
          <span ref={copyIconRef} className={actionLabel} style={{ width: ACTION_PX }}>
            <CopyIcon />
            {t('common.copy')}
          </span>
        </Button>
      )}
      {touch && (
        <Button
          ref={removeRef}
          tabIndex={-1}
          aria-hidden
          className={cn(action, 'justify-end bg-destructive text-background hover:bg-destructive/90')}
          onClick={() => leave(0)}
        >
          <span ref={removeIconRef} className={actionLabel} style={{ width: ACTION_PX }}>
            <Trash2Icon />
            {t('common.remove')}
          </span>
        </Button>
      )}
      <div
        ref={rowRef}
        {...bind()}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'transform' && !leaving.current) settled()
        }}
        className={cn('relative bg-background', touch && 'touch-pan-y', className)}
      >
        {children}
      </div>
    </Tag>
  )
}
