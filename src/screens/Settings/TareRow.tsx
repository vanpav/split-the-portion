import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { NumberField } from '@/components/NumberField'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatGrams, isValidTareGrams, type Tare } from '@/domain'
import { useAppStore } from '@/store/store'
import { SettingsRow } from './SettingsRow'

interface TareRowProps {
  tare: Tare
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** «Кастрюля 3 л · 850 г»; open — edit in place: only valid values reach the store, an emptied name is restored on blur. */
export function TareRow({ tare, open, onOpenChange }: TareRowProps) {
  const upsertTare = useAppStore((s) => s.upsertTare)
  const deleteTare = useAppStore((s) => s.deleteTare)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const nameEmpty = nameDraft !== null && nameDraft.trim() === ''

  const remove = () => {
    deleteTare(tare.id)
    toast(`«${tare.name}» удалена`, {
      duration: 5000,
      action: { label: 'Отменить', onClick: () => upsertTare(tare) },
    })
  }

  return (
    <SettingsRow open={open} onOpenChange={onOpenChange} title={tare.name} value={`${formatGrams(tare.grams)} г`}>
      <div className="flex items-start gap-2">
        <Field className="min-w-0 flex-1" data-invalid={nameEmpty || undefined}>
          <Input
            aria-label="Название тары"
            aria-invalid={nameEmpty || undefined}
            value={nameDraft ?? tare.name}
            onFocus={() => setNameDraft(tare.name)}
            onBlur={() => setNameDraft(null)}
            onChange={(e) => {
              setNameDraft(e.target.value)
              const name = e.target.value.trim()
              if (name) upsertTare({ ...tare, name })
            }}
          />
          {nameEmpty && <FieldError>Введите название</FieldError>}
        </Field>
        <NumberField
          className="w-28 shrink-0"
          ariaLabel={`Вес тары «${tare.name}»`}
          value={tare.grams}
          validate={(grams) => (isValidTareGrams(grams) ? null : 'Вес должен быть больше 0')}
          onValueChange={(grams) => isValidTareGrams(grams) && upsertTare({ ...tare, grams })}
        />
        <Button variant="ghost" size="icon" aria-label={`Удалить «${tare.name}»`} onClick={remove}>
          <Trash2Icon />
        </Button>
      </div>
    </SettingsRow>
  )
}
