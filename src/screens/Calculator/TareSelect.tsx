import { PlusIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { NewTareDialog } from '@/components/NewTareDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatGrams, type Id, type Tare } from '@/domain'

const NO_TARE = 'none'
// Not a tare: picking it opens the new tare dialog, the select keeps its value.
const ADD_TARE = 'add'

interface TareSelectProps {
  tares: Tare[]
  tareId: Id | null
  onTare: (id: Id | null) => void
}

/**
 * What «Готовый» was weighed in, as a quiet line under the readouts: «Без тары ▾».
 * The list ends with «Добавить тару»: new tares are made in a dialog, the first one is selected at once.
 */
export function TareSelect({ tares, tareId, onTare }: TareSelectProps) {
  const [adding, setAdding] = useState(false)
  // «Добавить тару» picked: the dialog opens once the list has closed — the list keeps focus while open.
  const addPicked = useRef(false)
  const pick = (v: string) => {
    if (v === ADD_TARE) addPicked.current = true
    else onTare(v === NO_TARE ? null : v)
  }

  return (
    <>
      <Select value={tareId ?? NO_TARE} onValueChange={pick}>
        <SelectTrigger
          aria-label="Тара"
          className="h-11 w-auto max-w-full min-w-0 gap-1 border-none bg-transparent px-1 text-sm text-muted-foreground shadow-none hover:text-foreground dark:bg-transparent dark:hover:bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="start"
          onCloseAutoFocus={(e) => {
            if (!addPicked.current) return
            // Focus stays with the dialog instead of going back to the select.
            e.preventDefault()
            addPicked.current = false
            setAdding(true)
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
      <NewTareDialog open={adding} onOpenChange={setAdding} onSelect={(tare) => onTare(tare.id)} />
    </>
  )
}
