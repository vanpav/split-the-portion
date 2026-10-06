import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigationType } from 'react-router'
import { cn } from '@/lib/utils'
import { enterAnimation, uaAnimatedKey } from './enterAnimation'

const ENTER = 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-safe:ease-out'

/**
 * The entering screen slides in (docs/UX.md «Переходы между экранами»): a new entry in history (PUSH)
 * goes deeper and comes from the right, a step back (POP: «←» via useBack, the system «назад») comes
 * from the left. A replaced entry, the first screen of the page and a step the browser has already
 * animated itself (the edge swipe in iOS Safari) do not animate.
 * Keyed by path, so a screen remounts (and animates) only when the path changes, not while typing.
 */
export function ScreenTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  // The page's first location (load, reload). Compared by identity: a step back to the first entry
  // has the same key, but every navigation gives a new location object.
  const [first] = useState(location)
  // Key of the entry the browser animated into on the last popstate; every popstate overwrites it,
  // so the flag never outlives its own navigation.
  const [skipKey, setSkipKey] = useState<string | null>(null)

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => setSkipKey(uaAnimatedKey(event))
    // Capture: runs before React Router's own popstate listener (added earlier, without capture),
    // so the key is set no later than the location it belongs to.
    window.addEventListener('popstate', onPopState, { capture: true })
    return () => window.removeEventListener('popstate', onPopState, { capture: true })
  }, [])

  const animation = enterAnimation({
    isFirst: location === first,
    navigationType,
    locationKey: location.key,
    uaAnimatedKey: skipKey,
  })

  return (
    // `clip`, not `hidden`: the shifted screen adds no horizontal scroll, and sticky headers keep working.
    // On the outer box: the clip of an element does not cover its own transform.
    <div className="flex flex-1 flex-col overflow-x-clip">
      <div
        key={location.pathname}
        className={cn(
          'flex flex-1 flex-col',
          animation !== 'none' && ENTER,
          animation === 'back' && 'motion-safe:slide-in-from-left-6',
          animation === 'forward' && 'motion-safe:slide-in-from-right-6',
        )}
      >
        {children}
      </div>
    </div>
  )
}
