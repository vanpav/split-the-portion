import { PlusIcon } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { NumberField } from '@/components/NumberField'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isValidTareGrams } from '@/domain'
import { useAppStore } from '@/store/store'

export function NewTareForm() {
  const upsertTare = useAppStore((s) => s.upsertTare)
  const [name, setName] = useState('')
  const [grams, setGrams] = useState<number | null>(null)
  // Remounts the weight field after submit: a focused field keeps its typed text otherwise.
  const [round, setRound] = useState(0)
  const nameRef = useRef<HTMLInputElement>(null)
  const valid = name.trim() !== '' && isValidTareGrams(grams)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || !isValidTareGrams(grams)) return
    upsertTare({ name: name.trim(), grams })
    setName('')
    setGrams(null)
    setRound((r) => r + 1)
    nameRef.current?.focus()
  }

  return (
    <form className="flex items-start gap-2" onSubmit={submit}>
      <Field className="min-w-0 flex-1">
        <Input
          ref={nameRef}
          aria-label="Название новой тары"
          placeholder="Новая тара"
          enterKeyHint="next"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <NumberField
        key={round}
        className="w-28 shrink-0"
        ariaLabel="Вес новой тары"
        placeholder="вес"
        value={grams}
        onValueChange={setGrams}
      />
      <Button type="submit" variant="outline" size="icon" aria-label="Добавить тару" disabled={!valid}>
        <PlusIcon />
      </Button>
    </form>
  )
}
