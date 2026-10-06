import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_SPLIT_PORTIONS } from '@/domain'

interface PortionStepperProps {
  count: number
  onRemove: () => void
  onAdd: () => void
}

/**
 * «Доли» (docs/SPEC.md §3б): right of the share bar, where «На завтра» is for people. «+» adds a portion
 * with the average share, «−» takes the last one away; the count is in the picker («Доли · 6»).
 */
export function PortionStepper({ count, onRemove, onAdd }: PortionStepperProps) {
  return (
    // As tall and as round as the bar beside it.
    <div role="group" aria-label="Порции" className="flex shrink-0 gap-1 [&>button]:rounded-xl">
      <Button variant="outline" size="icon" className="h-12 w-11" aria-label="Убрать порцию" disabled={count <= 1} onClick={onRemove}>
        <MinusIcon />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-11"
        aria-label="Добавить порцию"
        disabled={count >= MAX_SPLIT_PORTIONS}
        onClick={onAdd}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
