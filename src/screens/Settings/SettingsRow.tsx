import { ChevronDownIcon } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import { SwipeRow, type SwipeRowHandle } from '@/components/SwipeRow'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface SettingsRowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  /** Right of the title on one line («850 г»), or under it while closed («Ваня 54 % · Ксюша 46 %»). */
  value?: ReactNode
  detail?: ReactNode
  /** The editor, shown while open. */
  children: ReactNode
  /** A swipe left on a touch screen removes the row (the caller offers «Отменить»). */
  onSwipeRemove?: () => void
  /** With `onSwipeRemove`: the item's id, so the row unfolds when put back by «Отменить». */
  itemId?: string
  /** With `onSwipeRemove`: `remove()` slides the row out and folds it up, for the row's own button. */
  ref?: Ref<SwipeRowHandle>
}

/**
 * One line of a settings list: a summary to read, tap to edit it in place.
 * Only one row of a list is open at a time (the section holds which).
 */
export function SettingsRow({
  open,
  onOpenChange,
  title,
  value,
  detail,
  children,
  onSwipeRemove,
  itemId,
  ref,
}: SettingsRowProps) {
  const row = (
    <Collapsible open={open} onOpenChange={onOpenChange} asChild>
      <div className={cn('transition-colors', open && 'bg-muted/40')}>
        <CollapsibleTrigger className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{title}</span>
            {detail && !open && <span className="truncate text-sm text-muted-foreground tabular-nums">{detail}</span>}
          </span>
          {value && <span className="shrink-0 text-muted-foreground tabular-nums">{value}</span>}
          <ChevronDownIcon
            aria-hidden
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 px-4 pt-1 pb-4">{children}</CollapsibleContent>
      </div>
    </Collapsible>
  )
  return onSwipeRemove ? (
    <SwipeRow as="li" ref={ref} itemId={itemId} onRemove={onSwipeRemove}>
      {row}
    </SwipeRow>
  ) : (
    <li>{row}</li>
  )
}
