import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { SplitMode } from '@/domain'

const OPTIONS: { value: SplitMode; label: string }[] = [
  { value: 'people', label: 'Люди' },
  { value: 'portions', label: 'Порции' },
]

/** «Люди | Порции» (docs/SPEC.md §3б «Режим порций»): one choice for every dish on this device. */
export function SplitModeToggle({ value, onChange }: { value: SplitMode; onChange: (mode: SplitMode) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      aria-label="Как делить"
      value={value}
      // Tapping the pressed item gives '': the mode stays as it is.
      onValueChange={(v) => {
        const picked = OPTIONS.find((o) => o.value === v)
        if (picked) onChange(picked.value)
      }}
      className="w-full"
    >
      {OPTIONS.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="min-h-11 flex-1">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
