import { PlusIcon } from 'lucide-react'
import { useRef } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatGrams, type Id, type Tare } from '@/domain'
import { TARE_SELECT_ID } from '@/lib/domIds'

const NO_TARE = 'none'
// Not a tare: picking it opens the «Новая тара» screen, the select keeps its value.
const ADD_TARE = 'add'

interface TareSelectProps {
  tares: Tare[]
  tareId: Id | null
  onTare: (id: Id | null) => void
  /** «Добавить тару»: open the «Новая тара» screen. */
  onAdd: () => void
}

/**
 * What «Готовый» was weighed in, as a quiet line under the readouts: «Без тары ▾».
 * The list ends with «Добавить тару»: new tares are made on the «Новая тара» screen (docs/UX.md §3а).
 */
export function TareSelect({ tares, tareId, onTare, onAdd }: TareSelectProps) {
  // «Добавить тару» picked: the screen opens once the list has closed — the list keeps focus while open.
  const addPicked = useRef(false)
  const pick = (v: string) => {
    if (v === ADD_TARE) addPicked.current = true
    else onTare(v === NO_TARE ? null : v)
  }

  return (
    <Select value={tareId ?? NO_TARE} onValueChange={pick}>
      <SelectTrigger
        id={TARE_SELECT_ID}
        data-hint="tare"
        aria-label="Тара"
        className="h-11 w-auto max-w-full min-w-0 gap-1 border-none bg-transparent px-1 text-sm text-muted-foreground shadow-none hover:text-foreground dark:bg-transparent dark:hover:bg-transparent"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        onCloseAutoFocus={(e) => {
          if (!addPicked.current) return
          // The screen takes the focus instead of the select.
          e.preventDefault()
          addPicked.current = false
          onAdd()
        }}
      >
        <SelectItem value={NO_TARE}>Без тары</SelectItem>
        {tares.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name} · {formatGrams(t.grams)} г
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={ADD_TARE}>
          <PlusIcon />
          Добавить тару
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
