import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatGrams, type Id, type Tare } from '@/domain'
import { cn } from '@/lib/utils'
import { Caret } from './Caret'
import { displayRowBox } from './displayRowBox'

const NO_TARE = 'none'

interface CookedRowProps {
  label: string
  text: string
  active: boolean
  onActivate: () => void
  /** Several rows (a composite dish): smaller digits so they fit. */
  compact?: boolean
  tares: Tare[]
  tareId: Id | null
  onTare: (id: Id | null) => void
  /** Bottom right, under the number: «360 г без тары · k = 2,4»; null until weighed. */
  note: string | null
  /** Under the field, on the right: what is wrong with the weight («вес меньше тары»). */
  error: string | null
  /** People eating today: the caret blinks through their lid colors. */
  lids: number
}

/**
 * «Готовый» on the calculator display: the weight on the scale, and under its label the tare it was
 * weighed in. The whole row is the keypad target; only the tare under the label opens its list.
 * Under the number — the weight without the tare and k; under the field, on the right — an error.
 */
export function CookedRow({ label, text, active, onActivate, compact, tares, tareId, onTare, note, error, lids }: CookedRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'relative rounded-xl border transition-colors',
          // The row being typed into is a lidded box on the frosted ground.
          active ? 'border-border bg-card' : 'border-transparent hover:bg-card/60',
        )}
      >
        {/* A button cannot hold the tare select: the row's button lies under the layout instead. */}
        <button
          type="button"
          aria-pressed={active}
          aria-label={`${label}: ${text || 'не введено'} г`}
          onClick={onActivate}
          className="absolute inset-0 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <div
          className={cn(
            'pointer-events-none relative flex items-start justify-between gap-3 px-4',
            displayRowBox(compact),
          )}
        >
          <div className="flex min-w-0 flex-col items-start">
            <span className={cn('truncate text-sm leading-tight', active ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
            <Select value={tareId ?? NO_TARE} onValueChange={(v) => onTare(v === NO_TARE ? null : v)}>
              <SelectTrigger
                aria-label="Тара"
                // Small to look at, 44 px to hit: the height reaches out, the margins pull it back.
                className="pointer-events-auto -my-2.5 h-11 w-auto max-w-full gap-1 border-none bg-transparent px-0 text-sm text-muted-foreground shadow-none hover:text-foreground dark:bg-transparent dark:hover:bg-transparent"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={NO_TARE}>Без тары</SelectItem>
                {tares.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {formatGrams(t.grams)} г
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span
              className={cn(
                'flex items-baseline leading-tight font-medium whitespace-nowrap tabular-nums',
                compact ? 'text-2xl' : 'text-4xl',
                !text && 'text-muted-foreground/50',
              )}
            >
              {text || '0'}
              {active && <Caret lids={lids} />}
              <span className="ml-1 text-base font-normal text-muted-foreground">г</span>
            </span>
            {/* Kept even when empty, so the row does not grow on the first key. */}
            <span className="min-h-5 text-xs leading-5 whitespace-nowrap text-muted-foreground tabular-nums">{note}</span>
          </div>
        </div>
      </div>
      {/* Kept even when empty, like the note: nothing below moves on the first key. */}
      <p className="min-h-5 px-4 text-right text-sm leading-5 text-destructive">{error}</p>
    </div>
  )
}
