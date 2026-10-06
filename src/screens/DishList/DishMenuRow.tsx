import { CommandItem } from '@/components/ui/command'

interface DishMenuRowProps {
  /** Unique in the menu: cmdk keeps the selection by it. */
  value: string
  title: string
  /** The usual weight («200 г») or what it is made of. */
  summary: string
  onSelect: () => void
}

/** One row of the dish menu: 44 px and more, the title on the left, the weight or the recipe on the right. */
export function DishMenuRow({ value, title, summary, onSelect }: DishMenuRowProps) {
  return (
    <CommandItem value={value} onSelect={onSelect} className="min-h-11 text-base">
      <span className="max-w-[65%] shrink-0 truncate">{title}</span>
      <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground tabular-nums">{summary}</span>
    </CommandItem>
  )
}
