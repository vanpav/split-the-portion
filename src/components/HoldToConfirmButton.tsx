import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

interface HoldToConfirmButtonProps {
  onConfirm: () => void
  /** What the button says before it is held: «Удерживай, чтобы удалить». */
  label: string
  /** Shown once confirmed, while the action runs: «Удаляем…». */
  busyLabel: string
  busy?: boolean
  seconds?: number
  className?: string
}

/**
 * The last step of an action that cannot be undone (deleting or resetting the account): hold the
 * button for `seconds`. While held, red fills it from the left and the label counts down
 * «Держи ещё 4 с»; let go earlier and it runs back, nothing happens. The big brother of
 * `HoldButton`: a finger, a mouse and Enter/Space all work.
 */
export function HoldToConfirmButton({ onConfirm, label, busyLabel, busy = false, seconds = 5, className }: HoldToConfirmButtonProps) {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [left, setLeft] = useState(seconds)
  const confirm = useRef(onConfirm)
  useEffect(() => {
    confirm.current = onConfirm
  })

  useEffect(() => {
    if (endAt === null) return
    let shown = seconds
    const id = setInterval(() => {
      const ms = endAt - performance.now()
      if (ms <= 0) {
        clearInterval(id)
        setEndAt(null)
        navigator.vibrate?.(40)
        confirm.current()
        return
      }
      const s = Math.ceil(ms / 1000)
      if (s !== shown) {
        shown = s
        setLeft(s)
        navigator.vibrate?.(10)
      }
    }, 50)
    return () => clearInterval(id)
  }, [endAt, seconds])

  const holding = endAt !== null
  const start = () => {
    if (holding || busy) return
    setLeft(seconds)
    setEndAt(performance.now() + seconds * 1000)
  }
  const stop = () => setEndAt(null)

  const text = busy ? busyLabel : holding ? t('common.holdLeft', { count: left }) : label
  // Busy: the fill stays full until the action is over.
  const filled = holding || busy

  return (
    <button
      type="button"
      disabled={busy}
      aria-description={t('common.holdSeconds', { count: seconds })}
      onPointerDown={(e) => e.button === 0 && start()}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          start()
        }
      }}
      onKeyUp={(e) => (e.key === 'Enter' || e.key === ' ') && stop()}
      onBlur={stop}
      // A long press must not open the system menu or select text.
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'relative h-12 w-full touch-manipulation overflow-hidden rounded-lg border border-destructive/40 bg-destructive/10 text-base font-medium text-destructive outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-3 focus-visible:ring-destructive/30 disabled:cursor-default dark:bg-destructive/20',
        className,
      )}
    >
      <span className="tabular-nums">{text}</span>
      {/* The same label in reverse colours under a clip that opens left to right: the fill reads as one piece. */}
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-destructive text-background tabular-nums"
        style={{
          clipPath: filled ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transition: holding ? `clip-path ${seconds}s linear` : busy ? 'none' : 'clip-path 200ms ease-out',
        }}
      >
        {text}
      </span>
    </button>
  )
}
