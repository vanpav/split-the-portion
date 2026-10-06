import { TriangleAlertIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NumberField } from '@/components/NumberField'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatGrams, type CookingWarning, type Id, type PhaseResult, type Weighing } from '@/domain'
import { useAppStore } from '@/store/store'
import { focusOrBlur } from '@/lib/domIds'
import { kOutOfRangeText, kText, TARE_EXCEEDS_TEXT } from './messages'
import { TarePicker } from './TarePicker'

/** The selected mode must be obvious at a glance. */
const SEGMENT = 'flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'

interface WeighingEditorProps {
  cookingId: Id
  weighing: Weighing
  phase: PhaseResult
  warnings: CookingWarning[]
  /** Re-weighing of the leftover (phase ≥ 2). */
  leftover: boolean
  /** Raw grams of the base ingredient left for this phase; null for the first phase or a composite dish. */
  availableRaw?: number | null
  /** «сухого» / «сырого». */
  rawUnit?: string
  autoFocus?: boolean
  /** Today's raw weight fields: they share the row with the weight after cooking. */
  before?: ReactNode
}

/** One weighing: food weight directly, or a tare from the library + weight with tare. */
export function WeighingEditor({
  cookingId,
  weighing,
  phase,
  warnings,
  leftover,
  availableRaw = null,
  rawUnit = 'сырого',
  autoFocus,
  before,
}: WeighingEditorProps) {
  const setWeighing = useAppStore((s) => s.setWeighing)
  // "С тарой" is shown before a tare is picked; the store switches only once there is a tare.
  const [pickingTare, setPickingTare] = useState(false)
  // Mode and tare are usually set by the recipe: folded into one line until «изменить».
  const [editingMode, setEditingMode] = useState(false)
  const showMode = editingMode || pickingTare
  const mode = weighing.kind === 'withTare' || pickingTare ? 'withTare' : 'food'

  const changeMode = (next: string) => {
    if (next === 'food') {
      setPickingTare(false)
      if (weighing.kind !== 'food') setWeighing(cookingId, { id: weighing.id, at: weighing.at, kind: 'food', grams: null })
    } else if (next === 'withTare') {
      setPickingTare(true)
    }
  }

  const kWarning = warnings.find(
    (w): w is Extract<CookingWarning, { code: 'kOutOfRange' }> =>
      w.code === 'kOutOfRange' && w.weighingId === weighing.id,
  )

  const weightField = (label: string) => (
    <NumberField
      label={label}
      autoFocus={autoFocus}
      onEnter={() => focusOrBlur(null)}
      value={weighing.grams}
      onValueChange={(grams) => setWeighing(cookingId, { ...weighing, grams })}
    />
  )

  // One quiet line under the weights: tare, leftover of a re-weighing, k.
  const summary = [
    {
      text:
        weighing.kind === 'withTare'
          ? `в «${weighing.tare.name}» ${formatGrams(weighing.tare.grams)} г${phase.foodGrams !== null ? ` → ${formatGrams(phase.foodGrams)} г еды` : ''}`
          : 'без тары',
      strong: false,
    },
    ...(availableRaw !== null ? [{ text: `остаток ${formatGrams(availableRaw)} г ${rawUnit}`, strong: false }] : []),
    ...(phase.k ? [{ text: kText(phase.k, leftover), strong: true }] : []),
  ]

  return (
    <div className="flex flex-col gap-3">
      {showMode && (
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={mode}
          onValueChange={changeMode}
          aria-label="Как взвешивали"
        >
          <ToggleGroupItem value="food" className={SEGMENT}>
            Без тары
          </ToggleGroupItem>
          <ToggleGroupItem value="withTare" className={SEGMENT}>
            С тарой
          </ToggleGroupItem>
        </ToggleGroup>
      )}

      {mode === 'withTare' && showMode && (
        <TarePicker
          value={weighing.kind === 'withTare' ? weighing.tare : null}
          onSelect={(tare) => {
            setWeighing(cookingId, {
              id: weighing.id,
              at: weighing.at,
              kind: 'withTare',
              grams: weighing.kind === 'withTare' ? weighing.grams : null,
              tare,
            })
            setPickingTare(false)
          }}
        />
      )}

      <div className="grid grid-cols-2 items-start gap-3">
        {before}
        {mode === 'food' && weighing.kind === 'food' && weightField('Готовый вес')}
        {weighing.kind === 'withTare' && weightField('Готовый с тарой')}
      </div>
      {phase.weighingError === 'tareExceeds' && <FieldError>{TARE_EXCEEDS_TEXT}</FieldError>}

      <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
        {summary.map((part, index) => (
          <span key={part.text} className={part.strong ? 'font-medium text-foreground' : undefined}>
            {index > 0 && <span aria-hidden> · </span>}
            {part.text}
          </span>
        ))}
        <Button
          variant="link"
          className="h-11 px-1.5 text-sm font-normal"
          onClick={() => {
            setEditingMode(!showMode)
            setPickingTare(false)
          }}
        >
          {showMode ? 'готово' : 'изменить'}
        </Button>
      </p>

      {kWarning && (
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle className="line-clamp-none">{kOutOfRangeText(kWarning.k, kWarning.maybeForgotTare)}</AlertTitle>
        </Alert>
      )}
    </div>
  )
}
