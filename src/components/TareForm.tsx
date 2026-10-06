import { PlusIcon } from 'lucide-react'
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { TareGramsField } from '@/components/TareGramsField'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isValidTareGrams, type Tare } from '@/domain'
import { useAppStore } from '@/store/store'

interface TareFormProps {
  /** The tare just written to the library. */
  onCreated?: (tare: Tare) => void
  autoFocus?: boolean
  /** Next to «Добавить тару» (e.g. «К списку»). */
  secondary?: ReactNode
}

/**
 * A new tare for the library: name and weight (field or slider). The same form in the settings,
 * in the calculator's «Добавить тару» dialog and in the cooking screen's tare picker.
 * After adding it is empty again, the name focused for the next one.
 */
export function TareForm({ onCreated, autoFocus, secondary }: TareFormProps) {
  const upsertTare = useAppStore((s) => s.upsertTare)
  const nameId = useId()
  const [name, setName] = useState('')
  const [grams, setGrams] = useState<number | null>(null)
  // Remounts the weight field after submit: a focused field keeps its typed text otherwise.
  const [round, setRound] = useState(0)
  const nameRef = useRef<HTMLInputElement>(null)
  const valid = name.trim() !== '' && isValidTareGrams(grams)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // A form inside a dialog or popover must not submit the one around it.
    e.stopPropagation()
    if (!valid || !isValidTareGrams(grams)) return
    const tare = { name: name.trim(), grams }
    const id = upsertTare(tare)
    setName('')
    setGrams(null)
    setRound((r) => r + 1)
    nameRef.current?.focus()
    onCreated?.({ ...tare, id })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor={nameId}>Название</FieldLabel>
        <Input
          ref={nameRef}
          id={nameId}
          placeholder="Кастрюля 3 л"
          enterKeyHint="next"
          autoComplete="off"
          autoFocus={autoFocus}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <TareGramsField key={round} label="Вес" value={grams} onValueChange={setGrams} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!valid}>
          <PlusIcon data-icon="inline-start" />
          Добавить тару
        </Button>
        {secondary}
      </div>
    </form>
  )
}
