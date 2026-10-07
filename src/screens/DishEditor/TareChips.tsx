import { PlusIcon } from 'lucide-react'
import type { Ref } from 'react'
import { Link, type To } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { formatGrams, type Id, type Tare } from '@/domain'
import { cn } from '@/lib/utils'

interface TareChipsProps {
  tares: Tare[]
  /** The live tare (`liveTareId`); null — «Без тары». */
  tareId: Id | null
  onChange: (tareId: Id | null) => void
  /** «Новая тара» over the form. */
  addTo: To
  addRef?: Ref<HTMLAnchorElement>
  onAdd?: () => void
}

const CHIP = 'group/chip flex h-11 shrink-0 items-center rounded-full outline-none'
const PILL = 'h-9 rounded-full px-3.5 text-sm group-focus-visible/chip:ring-[3px] group-focus-visible/chip:ring-ring/50'
// Ringed, not flooded: the same mark as the current dish on the shelf.
const SELECTED = 'bg-card font-semibold ring-2 ring-foreground ring-inset hover:bg-card'

/**
 * «В чём взвешиваете» in the dish editor (docs/UX.md §3): a row of chips scrolling sideways as a whole,
 * «+» first (a new tare on a screen over the form), then «Без тары» and the tares with their weight.
 */
export function TareChips({ tares, tareId, onChange, addTo, addRef, onAdd }: TareChipsProps) {
  const chip = (id: Id | null, label: string, grams?: number) => {
    const selected = id === tareId
    return (
      <button key={id ?? 'none'} type="button" aria-pressed={selected} onClick={() => onChange(id)} className={CHIP}>
        <span className={cn(buttonVariants({ variant: 'secondary' }), PILL, selected && SELECTED)}>
          {label}
          {grams !== undefined && <span className="font-normal text-muted-foreground tabular-nums">{formatGrams(grams)} г</span>}
        </span>
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-labelledby="dish-tare-title"
      // The fade at the right edge says «more this way»; the scrollbar would only take height.
      className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Link ref={addRef} to={addTo} onClick={onAdd} aria-label="Добавить тару" className={CHIP}>
        <span
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'size-9 rounded-full border border-dashed border-muted-foreground/50 group-focus-visible/chip:ring-[3px] group-focus-visible/chip:ring-ring/50',
          )}
        >
          <PlusIcon />
        </span>
      </Link>
      {chip(null, 'Без тары')}
      {tares.map((t) => chip(t.id, t.name, t.grams))}
    </div>
  )
}
