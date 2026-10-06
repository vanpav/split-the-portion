import { useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { NavigationAnimationContext, screenEnterClass } from './screenAnimation'

/**
 * A screen over another (docs/UX.md §3а), rendered by the one under it in place of its hidden
 * content. It keeps that screen's key in app/ScreenTransition, so it comes in by itself: the
 * animation of the navigation that opened it, fixed when it mounts.
 */
export function OverScreen({ children }: { children: ReactNode }) {
  const current = useContext(NavigationAnimationContext)
  const [animation] = useState(current)
  return <div className={cn('flex flex-1 flex-col', screenEnterClass(animation))}>{children}</div>
}
