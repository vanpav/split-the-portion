import { Trash2Icon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { NumberField } from '@/components/NumberField'
import type { SwipeRowHandle } from '@/components/SwipeRow'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isValidTareGrams, type Tare } from '@/domain'
import { useAppStore } from '@/store/store'
import { SettingsRow } from './SettingsRow'
import { t } from '@/i18n'
import { gramsText } from '@/i18n/format'

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
  const rowRef = useRef<SwipeRowHandle>(null)

  const remove = () => {
    deleteTare(tare.id)
    toast(t('settings.tares.deleted', { name: tare.name }), {
      duration: 5000,
      action: { label: t('common.undo'), onClick: () => upsertTare(tare) },
    })
  }

  return (
    <SettingsRow
      open={open}
      onOpenChange={onOpenChange}
      title={tare.name}
      value={gramsText(tare.grams)}
      onSwipeRemove={remove}
      itemId={tare.id}
      ref={rowRef}
    >
      <div className="flex items-start gap-2">
        <Field className="min-w-0 flex-1" data-invalid={nameEmpty || undefined}>
          <Input
            aria-label={t('settings.tares.nameLabel')}
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
          {nameEmpty && <FieldError>{t('common.enterName')}</FieldError>}
        </Field>
        <NumberField
          className="w-28 shrink-0"
          ariaLabel={t('settings.tares.weightOf', { name: tare.name })}
          value={tare.grams}
          validate={(grams) => (isValidTareGrams(grams) ? null : t('common.tare.weightPositive'))}
          onValueChange={(grams) => isValidTareGrams(grams) && upsertTare({ ...tare, grams })}
        />
        {/* On a touch screen the row is swiped left instead; the button stays for the keyboard. */}
        <Button
          variant="ghost"
          size="icon"
          className="pointer-coarse:sr-only"
          aria-label={t('settings.tares.delete', { name: tare.name })}
          // The row slides out and folds up, as after a swipe.
          onClick={() => rowRef.current?.remove()}
        >
          <Trash2Icon />
        </Button>
      </div>
    </SettingsRow>
  )
}
