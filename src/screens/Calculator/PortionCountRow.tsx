import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_SPLIT_PORTIONS, portionsLabel } from '@/domain'

interface PortionCountRowProps {
  count: number
  onRemove: () => void
  onAdd: () => void
}

/**
 * The last line of the list in «Доли» instead of «+ Имя» (docs/SPEC.md §3б): «− 6 порций +».
 * «+» adds a portion with the average share, «−» takes the last one away.
 */
export function PortionCountRow({ count, onRemove, onAdd }: PortionCountRowProps) {
  return (
    <li className="flex min-h-14 items-center justify-between gap-2 py-2">
      <Button variant="outline" size="icon" className="size-11" aria-label="Убрать порцию" disabled={count <= 1} onClick={onRemove}>
        <MinusIcon />
      </Button>
      <span className="text-base font-medium tabular-nums" aria-live="polite">
        {portionsLabel(count)}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-11"
        aria-label="Добавить порцию"
        disabled={count >= MAX_SPLIT_PORTIONS}
        onClick={onAdd}
      >
        <PlusIcon />
      </Button>
    </li>
  )
}
