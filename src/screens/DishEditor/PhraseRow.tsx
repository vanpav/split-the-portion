import { TriangleAlertIcon, XIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { PhraseItem } from '@/domain'
import { phraseIssueText, phraseWeightText } from '@/domain/phraseText'
import { cn } from '@/lib/utils'

interface PhraseRowProps {
  item: PhraseItem
  /** The field's caret is in this product's text: the row stands out. */
  current: boolean
  onToggle: () => void
  onRemove: () => void
}

/** Keeps the caret and the keyboard in «Что в блюде»: a row is a reflection of the text, not a field. */
const keepFocus = (e: MouseEvent) => e.preventDefault()

/**
 * A product of «Что в блюде» in the parse list (docs/UX.md §3 «Разбор»): a tap counts it or not,
 * × cuts it out of the phrase. Its notes under it: errors red, warnings amber.
 */
export function PhraseRow({ item, current, onToggle, onRemove }: PhraseRowProps) {
  const name = item.name || 'Без названия'
  return (
    <li className={cn('flex flex-col rounded-lg transition-colors', current && 'bg-card shadow-xs')}>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={`${name}: ${item.excluded ? 'не учитывается' : 'в учёте'}`}
          aria-pressed={!item.excluded}
          onMouseDown={keepFocus}
          onClick={onToggle}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg pl-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className={cn('truncate', !item.name && 'text-muted-foreground italic', item.excluded && 'text-muted-foreground')}>
            {name}
          </span>
          {item.excluded && (
            <span className="shrink-0 rounded-md bg-background px-1.5 py-0.5 text-xs text-muted-foreground">не учит.</span>
          )}
          <span
            className={cn(
              'ml-auto shrink-0 tabular-nums',
              item.rawGrams !== null && !item.amount ? 'font-semibold' : 'text-muted-foreground',
              item.excluded && 'font-normal text-muted-foreground',
            )}
          >
            {phraseWeightText(item)}
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 text-muted-foreground"
          aria-label={`Убрать «${name}» из блюда`}
          onMouseDown={keepFocus}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>
      {item.issues.length > 0 && (
        <ul className="flex flex-col gap-0.5 pr-11 pb-2 pl-2.5">
          {item.issues.map((issue, index) => (
            <li
              key={index}
              className={cn('flex items-start gap-1 text-xs', issue.level === 'error' ? 'text-destructive' : 'text-warning')}
            >
              <TriangleAlertIcon aria-hidden className="mt-px size-3.5 shrink-0" />
              {phraseIssueText(issue)}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
