import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { MAX_SPLIT_PORTIONS } from '@/domain'

interface PortionStepperProps {
  count: number
  onRemove: () => void
  onAdd: () => void
}

/**
 * «Доли» (docs/SPEC.md §3б): «− 7 +» beside the «Кто ест» field — the number of portions between the
 * buttons, so they read as one control and the bar below gets the whole width. «+» adds a portion with
 * the average share, «−» takes the last one away.
 */
export function PortionStepper({ count, onRemove, onAdd }: PortionStepperProps) {
  return (
    <ButtonGroup aria-label="Порции" className="shrink-0">
      <Button variant="outline" size="icon" aria-label="Убрать порцию" disabled={count <= 1} onClick={onRemove}>
        <MinusIcon />
      </Button>
      <ButtonGroupText
        aria-live="polite"
        aria-label={`Порций: ${count}`}
        className="min-w-11 justify-center bg-background px-1 text-base font-semibold tabular-nums dark:bg-input/30"
      >
        {count}
      </ButtonGroupText>
      <Button variant="outline" size="icon" aria-label="Добавить порцию" disabled={count >= MAX_SPLIT_PORTIONS} onClick={onAdd}>
        <PlusIcon />
      </Button>
    </ButtonGroup>
  )
}
