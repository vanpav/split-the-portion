import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

interface HoldButtonProps {
  onConfirm: () => void
  label: string
  className?: string
  children: ReactNode
}

const HOLD_MS = 1500

/**
 * A destructive action done by holding (docs/SPEC.md §3б): while held, the button's border fills
 * up over 1.5 s; let go earlier and nothing happens. Works with a finger, a mouse and Enter/Space.
 */
export function HoldButton({ onConfirm, label, className, children }: HoldButtonProps) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const start = () => {
    if (timer.current) return
    setHolding(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setHolding(false)
      navigator.vibrate?.(15)
      onConfirm()
    }, HOLD_MS)
  }
  const stop = () => {
    if (!timer.current) return
    clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-description={t('common.hold')}
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
      {
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
              transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : 'stroke-dashoffset 150ms ease-out',
            }}
          />
        </svg>
      }
    </Button>
      </TooltipTrigger>
      <TooltipContent>{t('common.holdToRemove')}</TooltipContent>
    </Tooltip>
  )
}
