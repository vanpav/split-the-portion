import { Fragment } from 'react'
import { formatGrams, ingredientNames, type Cooking, type Id, type RawAmount } from '@/domain'

interface RawListProps {
  cooking: Cooking
  raw: RawAmount[]
  /** Ingredient already shown elsewhere in the row (the basis of the portion). */
  skip?: Id
}

/** «Курица 75 г · Картофель 50 г · …» — raw content of a portion for the tracker. */
export function RawList({ cooking, raw, skip }: RawListProps) {
  const names = ingredientNames(cooking)
  const items = raw.filter((r) => r.ingredientId !== skip)
  if (items.length === 0) return null

  return (
    <p className="text-sm text-muted-foreground">
      {items.map((r, index) => (
        <Fragment key={r.ingredientId}>
          {/* The separator stays outside the nowrap span so the line can wrap between items. */}
          {index > 0 && ' · '}
          <span className="whitespace-nowrap">
            {names.get(r.ingredientId)} <span className="text-foreground">{formatGrams(r.grams)} г</span>
          </span>
        </Fragment>
      ))}
    </p>
  )
}
