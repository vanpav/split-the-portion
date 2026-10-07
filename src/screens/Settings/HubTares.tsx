import { WeightIcon } from 'lucide-react'
import { formatGrams } from '@/domain'
import { useAppStore } from '@/store/store'
import { HubLink } from './HubLink'

/** Enough to recognise the library at a glance; the rest is counted. */
const SHOWN = 6

/** «Тара» on the hub: the containers as chips with their weights, like the dish chips on the shelf. */
export function HubTares() {
  const tares = useAppStore((s) => s.tares)
  const rest = tares.length - SHOWN

  return (
    <HubLink
      to="tares"
      Icon={WeightIcon}
      title="Тара"
      description={tares.length ? 'Вес пустой посуды' : 'Вес пустой посуды. Добавь кастрюлю или миску'}
    >
      {tares.length > 0 && (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {tares.slice(0, SHOWN).map((tare) => (
            <span key={tare.id} className="flex max-w-full min-w-0 items-baseline gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-sm">
              <span className="truncate">{tare.name}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{formatGrams(tare.grams)} г</span>
            </span>
          ))}
          {rest > 0 && <span className="rounded-full px-1.5 py-1 text-sm text-muted-foreground tabular-nums">+{rest}</span>}
        </span>
      )}
    </HubLink>
  )
}
