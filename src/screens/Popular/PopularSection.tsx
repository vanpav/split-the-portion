import { PopularRow } from './PopularRow'
import { CATEGORY_LABELS, type DishCategory, type PresetDish } from '@/domain'

interface PopularSectionProps {
  /** The heading is the category's name; null — no heading. */
  category: DishCategory | null
  presets: PresetDish[]
  query: string
  picked: ReadonlySet<string>
  taken: ReadonlySet<string>
  grams: (preset: PresetDish) => number | null
  fieldId: (preset: PresetDish) => string
  onToggleAll: (presets: PresetDish[], pick: boolean) => void
  onPick: (preset: PresetDish) => void
  onUnpick: (preset: PresetDish) => void
  onGrams: (preset: PresetDish, grams: number | null) => void
  onInvalid: (preset: PresetDish, invalid: boolean) => void
  onEnter: (preset: PresetDish) => void
}

/** A titled part of the list with «Отметить все» / «Снять все» (it only ticks, nothing is added). */
export function PopularSection({ category, presets, query, picked, taken, grams, fieldId, onToggleAll, onPick, onUnpick, onGrams, onInvalid, onEnter }: PopularSectionProps) {
  const free = presets.filter((p) => !taken.has(p.name))
  const allPicked = free.length > 0 && free.every((p) => picked.has(p.name))
  return (
    <section aria-label={category ? CATEGORY_LABELS[category] : undefined}>
      {category && (
        <div className="flex items-center justify-between gap-3 px-3 text-xs text-muted-foreground">
          <h2 className="flex min-w-0 items-baseline gap-2 pt-3 pb-1 font-medium">
            <span className="truncate">{CATEGORY_LABELS[category]}</span>
            <span className="tabular-nums">{presets.length}</span>
          </h2>
          {free.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleAll(free, !allPicked)}
              className="-mr-2 -mb-1 flex h-11 items-center rounded-lg px-2 text-sm font-medium text-primary outline-none hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {allPicked ? 'Снять все' : 'Отметить все'}
            </button>
          )}
        </div>
      )}
      <ul className="flex flex-col">
        {presets.map((preset) => (
          <PopularRow
            key={preset.name}
            preset={preset}
            query={query}
            picked={picked.has(preset.name)}
            taken={taken.has(preset.name)}
            grams={grams(preset)}
            fieldId={fieldId(preset)}
            onPick={() => onPick(preset)}
            onUnpick={() => onUnpick(preset)}
            onGrams={(g) => onGrams(preset, g)}
            onInvalid={(bad) => onInvalid(preset, bad)}
            onEnter={() => onEnter(preset)}
          />
        ))}
      </ul>
    </section>
  )
}
