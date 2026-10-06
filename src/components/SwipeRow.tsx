import { useDrag } from '@use-gesture/react'
import { CopyIcon, Trash2Icon } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Dragged less than this and let go, the row slides back. */
const OPEN_AT_PX = 48
/** How far an open row stays moved: the width of its action. */
const ACTION_PX = 104
/** Dragged past this part of the row's width and let go, the action is done at once. */
const FULL_SWIPE_RATIO = 0.5

interface SwipeRowProps {
  /** Swipe left: the red «Убрать» underneath; a full swipe removes at once (the caller offers «Отменить»). */
  onRemove: () => void
  /** Swipe right: «Копировать» underneath; a full swipe copies. Absent or null — the row does not go right. */
  onCopy?: (() => void) | null
  /** The element the row is: a list item in a list. */
  as?: 'li' | 'div'
  /** Classes of the moving row (padding, layout); it is opaque, so the actions stay hidden under it. */
  className?: string
  children: ReactNode
}

/**
 * A row that is swiped on a touch screen (phone, iPad): left — remove, right — copy. The row follows the
 * finger and the action shows underneath. With a mouse nothing moves: the row's own buttons do it.
 * On a touch screen those buttons are hidden by the caller with `pointer-coarse:sr-only` — still there
 * for the keyboard and a screen reader.
 */
export function SwipeRow({ onRemove, onCopy, as: Tag = 'div', className, children }: SwipeRowProps) {
  // Swipes are for fingers: a phone or an iPad, whatever its width.
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  const close = () => setX(0)
  const remove = () => {
    close()
    onRemove()
  }
  const copy = () => {
    close()
    onCopy?.()
  }

  const bind = useDrag(
    ({ active, tap, offset: [ox], swipe: [swipeX], cancel, event }) => {
      // A slider in the row moves its thumb, not the row.
      if (event.target instanceof Element && event.target.closest('[role="slider"]')) return cancel()
      if (tap) return close()
      const next = Math.min(ox, onCopy ? Infinity : 0)
      if (active) {
        setDragging(true)
        setX(next)
        return
      }
      setDragging(false)
      const full = (rowRef.current?.offsetWidth ?? Infinity) * FULL_SWIPE_RATIO
      if (next <= -full) return remove()
      if (next >= full) return copy()
      // A quick flick opens the action as a long drag does.
      const direction = swipeX !== 0 ? swipeX : Math.abs(next) >= OPEN_AT_PX ? Math.sign(next) : 0
      setX(direction < 0 ? -ACTION_PX : direction > 0 && onCopy ? ACTION_PX : 0)
    },
    // Vertical first — the page scrolls and the row stays put.
    { enabled: touch, axis: 'x', filterTaps: true, from: () => [x, 0] },
  )

  return (
    <Tag className="relative overflow-hidden">
      {x !== 0 && (
        // Only for the finger: the keyboard and a screen reader use the row's own buttons.
        <div aria-hidden className="absolute inset-0 flex">
          {x > 0 ? (
            <Button
              tabIndex={-1}
              className="h-full flex-col gap-1 rounded-none text-xs"
              style={{ width: Math.max(x, ACTION_PX) }}
              onClick={copy}
            >
              <CopyIcon />
              Копировать
            </Button>
          ) : (
            <Button
              tabIndex={-1}
              className="ml-auto h-full flex-col gap-1 rounded-none bg-destructive text-xs text-background hover:bg-destructive/90"
              style={{ width: Math.max(-x, ACTION_PX) }}
              onClick={remove}
            >
              <Trash2Icon />
              Убрать
            </Button>
          )}
        </div>
      )}
      <div
        ref={rowRef}
        {...bind()}
        className={cn(
          'relative bg-background',
          touch && 'touch-pan-y',
          !dragging && 'transition-transform duration-200 ease-out',
          className,
        )}
        style={x !== 0 ? { transform: `translateX(${x}px)` } : undefined}
      >
        {children}
      </div>
    </Tag>
  )
}
