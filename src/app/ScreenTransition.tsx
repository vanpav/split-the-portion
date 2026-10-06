import { useState, type ReactNode } from 'react'
import { useLocation, useNavigationType } from 'react-router'
import { cn } from '@/lib/utils'

const ENTER = 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-safe:ease-out'

/**
 * The entering screen slides in (docs/UX.md «Переходы между экранами»): a new entry in history (PUSH)
 * goes deeper and comes from the right, a step back (POP: «←» via useBack, the system «назад») comes
 * from the left. A replaced entry and the first screen of the page do not animate.
 * Keyed by path, so a screen remounts (and animates) only when the path changes, not while typing.
 */
export function ScreenTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  // The page's first location (load, reload). Compared by identity: a step back to the first entry
  // has the same key, but every navigation gives a new location object.
  const [first] = useState(location)
  const animate = location !== first && navigationType !== 'REPLACE'

  return (
    // `clip`, not `hidden`: the shifted screen adds no horizontal scroll, and sticky headers keep working.
    // On the outer box: the clip of an element does not cover its own transform.
    <div className="flex flex-1 flex-col overflow-x-clip">
      <div
        key={location.pathname}
        className={cn(
          'flex flex-1 flex-col',
          animate && ENTER,
          animate && (navigationType === 'POP' ? 'motion-safe:slide-in-from-left-6' : 'motion-safe:slide-in-from-right-6'),
        )}
      >
        {children}
      </div>
    </div>
  )
}
