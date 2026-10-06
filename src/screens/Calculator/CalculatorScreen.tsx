import { useState } from 'react'
import { useNavigationType, useParams } from 'react-router'
import { dishSwitchAnimation, type EnterAnimation } from '@/app/enterAnimation'
import type { Id } from '@/domain'
import { cn } from '@/lib/utils'
import { Calculator } from './Calculator'
import { DishShelf, type ChipTap } from './DishShelf'

/**
 * `/d/:id`. Every dish is one screen (app/ScreenTransition): going from one dish to another keeps
 * the shelf in place, with its scroll and order. The calculator is remounted per dish — its typed
 * numbers must not carry over — and, when the dish is switched here rather than the screen opened,
 * slides in briefly under the shelf from the side of the tapped chip (docs/UX.md «Переходы между экранами»).
 */
export function CalculatorScreen() {
  const { id } = useParams()
  const navigationType = useNavigationType()
  // The last chip tapped on the shelf: read once, by the switch it caused.
  const [tap, setTap] = useState<ChipTap | null>(null)
  // The dish shown and how it came in; the dish the screen opened with arrives with the screen's own
  // transition, not a second one.
  const [shown, setShown] = useState<{ id: Id | undefined; animation: EnterAnimation }>({ id, animation: 'none' })
  if (shown.id !== id) {
    const chip = tap?.id === id ? tap : null
    setShown({ id, animation: dishSwitchAnimation({ from: chip?.from ?? null, to: chip?.to ?? null, navigationType }) })
    setTap(null)
  }
  const animation = shown.id === id ? shown.animation : 'none'

  return (
    <>
      <DishShelf currentId={id} onChipTap={setTap} />
      <div
        key={id}
        className={cn(
          'flex flex-1 flex-col',
          animation !== 'none' && 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-safe:ease-out',
          animation === 'forward' && 'motion-safe:slide-in-from-right-4',
          animation === 'back' && 'motion-safe:slide-in-from-left-4',
        )}
      >
        <Calculator id={id} />
      </div>
    </>
  )
}
