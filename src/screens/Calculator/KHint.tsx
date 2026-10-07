import { useState } from 'react'
import type { YieldK } from '@/domain'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { K_HINT_TITLE, kHint, kText } from './messages'

const hoverCapable = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** «k блюда = 1,03» with the label underlined: a tooltip on desktop, a bottom sheet on touch. */
export function KHint({ k, leftover = false }: { k: YieldK; leftover?: boolean }) {
  const [open, setOpen] = useState(false)
  const [hover] = useState(hoverCapable)
  const text = kText(k, leftover)
  const hint = kHint(k, leftover)

  const trigger = (
    <button
      type="button"
      className="cursor-help underline decoration-current/50 decoration-dotted underline-offset-4"
      onClick={hover ? undefined : () => setOpen(true)}
    >
      {text}
    </button>
  )

  return (
    <>
      {hover ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent className="max-w-64 text-balance">{hint}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      {!hover && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="pb-[max(1rem,env(safe-area-inset-bottom))]">
            <SheetHeader>
              <SheetTitle>{K_HINT_TITLE}</SheetTitle>
              <SheetDescription>{hint}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
