import { PlusIcon } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'
import { NumberField } from '@/components/NumberField'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isValidTareGrams, type Tare } from '@/domain'
import { useAppStore } from '@/store/store'
import { t } from '@/i18n'

interface TareFormProps {
  /** The tare just written to the library. */
  onCreated?: (tare: Tare) => void
  autoFocus?: boolean
}

/**
 * A new tare for the library: big «Название» and «Вес» fields. The same form in the settings and
 * on the calculator's «Новая тара» screen. Enter in the name goes to the weight, Enter in the
 * weight adds. After adding it is empty again, the name focused for the next one.
 */
export function TareForm({ onCreated, autoFocus }: TareFormProps) {
  const upsertTare = useAppStore((s) => s.upsertTare)
  const nameId = useId()
  const gramsId = useId()
  const [name, setName] = useState('')
  const [grams, setGrams] = useState<number | null>(null)
  // Remounts the weight field after submit: a focused field keeps its typed text otherwise.
  const [round, setRound] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const valid = name.trim() !== '' && isValidTareGrams(grams)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // A form inside another one must not submit it.
    e.stopPropagation()
    if (!valid || !isValidTareGrams(grams)) return
    const id = upsertTare({ name: name.trim(), grams })
    setName('')
    setGrams(null)
    setRound((r) => r + 1)
    nameRef.current?.focus()
    onCreated?.(useAppStore.getState().tares.find((t) => t.id === id)!)
  }

  return (
    <form ref={formRef} className="flex flex-col gap-4" onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor={nameId}>{t('common.title')}</FieldLabel>
        <Input
          ref={nameRef}
          id={nameId}
          className="h-14 text-lg md:text-lg"
          placeholder={t('common.tare.namePlaceholder')}
          enterKeyHint="next"
          autoComplete="off"
          autoFocus={autoFocus}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            document.getElementById(gramsId)?.focus()
          }}
        />
      </Field>
      <NumberField
        key={round}
        id={gramsId}
        size="lg"
        label={t('common.weight')}
        placeholder="850"
        value={grams}
        validate={(g) => (g === null || isValidTareGrams(g) ? null : t('common.tare.weightPositive'))}
        onValueChange={setGrams}
        onEnter={() => {
          if (valid) formRef.current?.requestSubmit()
          else if (name.trim() === '') nameRef.current?.focus()
        }}
      />
      <Button type="submit" className="self-end" disabled={!valid}>
        <PlusIcon data-icon="inline-start" />
        {t('common.tare.add')}
      </Button>
    </form>
  )
}
