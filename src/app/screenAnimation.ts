import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import type { EnterAnimation } from './enterAnimation'

/**
 * How a screen entered by the current navigation comes in (app/ScreenTransition). Read by a screen
 * over another (app/OverScreen) and by the screen under it on the way back (`useReturnAnimation`):
 * neither changes the screen key, so ScreenTransition itself does not animate them.
 */
export const NavigationAnimationContext = createContext<EnterAnimation>('none')

/** Classes of an entering screen (docs/UX.md «Переходы между экранами»). */
export function screenEnterClass(animation: EnterAnimation): string {
  return cn(
    animation !== 'none' && 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-safe:ease-out',
    animation === 'back' && 'motion-safe:slide-in-from-left-6',
    animation === 'forward' && 'motion-safe:slide-in-from-right-6',
  )
}

/**
 * Classes for a part of the screen hidden under a screen over it: when it is shown again («назад»),
 * it comes in like an entering screen. It stays mounted, so the animation replays as the element
 * leaves `display: none`; when it is not covered the classes do not change, so nothing replays.
 */
export function useReturnAnimation(covered: boolean): string {
  const animation = useContext(NavigationAnimationContext)
  const [state, setState] = useState<{ covered: boolean; shown: EnterAnimation }>({ covered, shown: 'none' })
  let shown = state.shown
  if (state.covered !== covered) {
    shown = covered ? state.shown : animation
    setState({ covered, shown })
  }
  return screenEnterClass(shown)
}
