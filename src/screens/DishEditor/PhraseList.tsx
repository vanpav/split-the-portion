import type { PhraseItem } from '@/domain'
import { PhraseRow } from './PhraseRow'

interface PhraseListProps {
  items: PhraseItem[]
  /** The caret in «Что в блюде»; null — the field is not focused. */
  caret: number | null
  onToggle: (item: PhraseItem) => void
  onRemove: (index: number) => void
}

/** «Разбор» under «Что в блюде» (docs/UX.md §3): a row per product, on a matte ground. */
export function PhraseList({ items, caret, onToggle, onRemove }: PhraseListProps) {
  return (
    <section aria-labelledby="phrase-list-title" className="flex flex-col rounded-xl bg-muted/60 p-1.5">
      <h2 id="phrase-list-title" className="px-2.5 pt-1 pb-1.5 text-xs text-muted-foreground">
        Разбор · тап — учитывать или нет, × — убрать
      </h2>
      {items.length === 0 ? (
        <p className="px-2.5 pb-2 text-sm text-muted-foreground">Здесь появится разбор: продукт и вес.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item, index) => (
            <PhraseRow
              // Products have no ids: they are the text's parts, in its order.
              key={index}
              item={item}
              current={caret !== null && caret >= item.start && caret <= item.end}
              onToggle={() => onToggle(item)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
