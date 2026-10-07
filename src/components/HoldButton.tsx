import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HoldButtonProps {
  /** How long to hold; 0 — a plain click does it. */
  holdMs: number
  onConfirm: () => void
  label: string
  /** Shown when released too early: what holding would do. */
  hint: string
  className?: string
  children: ReactNode
}

/** A tap shorter than this is a tap, not an attempt to hold: it gets the hint. */
const TAP_MS = 300

/**
 * A destructive action done by holding (docs/SPEC.md §3б): while held, the button's border fills
 * up over `holdMs`; let go earlier and nothing happens. Works with a finger, a mouse and Enter/Space.
 */
export function HoldButton({ holdMs, onConfirm, label, hint, className, children }: HoldButtonProps) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedAt = useRef(0)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const start = () => {
    if (holdMs <= 0 || timer.current) return
    startedAt.current = Date.now()
    setHolding(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setHolding(false)
      navigator.vibrate?.(15)
      onConfirm()
    }, holdMs)
  }
  const stop = () => {
    if (!timer.current) return
    clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
    if (Date.now() - startedAt.current < TAP_MS) toast(hint, { id: 'hold-hint' })
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-description={holdMs > 0 ? 'Удерживай' : undefined}
      onClick={holdMs <= 0 ? onConfirm : undefined}
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
        'relative touch-manipulation select-none [-webkit-touch-callout:none]',
        className,
        holding && 'text-destructive hover:text-destructive',
      )}
    >
      {children}
      {holdMs > 0 && (
        // The border fills clockwise while held; on release it runs back quickly.
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <rect
            width="100%"
            height="100%"
            rx="8"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={holding ? 0 : 100}
            className="fill-none stroke-destructive stroke-2"
            style={{
              transition: holding ? `stroke-dashoffset ${holdMs}ms linear` : 'stroke-dashoffset 150ms ease-out',
            }}
          />
        </svg>
      )}
    </Button>
  )
}
