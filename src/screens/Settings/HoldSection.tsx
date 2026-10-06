import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAppStore } from '@/store/store'

const OPTIONS = [
  { ms: 0, label: 'Сразу' },
  { ms: 1000, label: '1 с' },
  { ms: 1500, label: '1,5 с' },
  { ms: 2000, label: '2 с' },
]

/** How long «×» is held before a person is removed from today's lineup (docs/SPEC.md §3б). */
export function HoldSection() {
  const holdMs = useAppStore((s) => s.holdMs)
  const setHoldMs = useAppStore((s) => s.setHoldMs)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold">Убрать человека</h2>
        <p className="text-sm text-muted-foreground">Сколько держать ×, чтобы не убрать случайно.</p>
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label="Сколько держать ×"
        value={String(holdMs)}
        onValueChange={(v) => v && setHoldMs(Number(v))}
        className="w-full"
      >
        {OPTIONS.map((o) => (
          <ToggleGroupItem key={o.ms} value={String(o.ms)} className="min-h-11 flex-1">
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  )
}
