import { ArrowLeftRightIcon, ChevronDownIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { CopyButton } from '@/components/CopyButton'
import { NumberField } from '@/components/NumberField'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  baseRawGrams,
  basisKey,
  convertPortionInput,
  defaultShareWeight,
  fillRemainder,
  formatGrams,
  rawAmountsCopyText,
  shareWeights,
  type Cooking,
  type CookingResult,
  type Portion,
  type PortionBasis,
  type PortionResult,
} from '@/domain'
import { focusOrBlur, portionGramsId } from '@/lib/domIds'
import { useAppStore } from '@/store/store'
import { rawWord } from './messages'
import { RawList } from './RawList'

export interface BasisOption {
  key: string
  basis: PortionBasis
  label: string
}

interface PersonRowProps {
  cooking: Cooking
  result: CookingResult
  portion: Portion
  computed: PortionResult
  /** Portions of the same phase: a person switched back to «по доле» gets a typical share. */
  phasePortions: Portion[]
  /** Units a gram portion can be entered in; the same for every row. */
  options: BasisOption[]
  /** A person just added: open with the name focused. */
  isNew: boolean
}

const ISSUE_TEXT = {
  missingIngredient: 'Выберите, в чём вводить',
  noCookedWeight: 'Взвесьте блюдо после готовки',
  nothingLeft: 'Ничего не осталось',
  empty: 'Введите порцию',
} as const

const weightError = (v: number | null) => (v !== null && v <= 0 ? 'Больше 0' : null)

/**
 * One person: the line to read at the stove («Ваня — положить 168 г»), and under it, on tap,
 * the name, the share or an own portion in grams for today, removal.
 */
export function PersonRow({ cooking, result, portion, computed, phasePortions, options, isNew }: PersonRowProps) {
  const updatePortion = useAppStore((s) => s.updatePortion)
  const removePortion = useAppStore((s) => s.removePortion)
  const restorePortion = useAppStore((s) => s.restorePortion)

  const { input } = computed
  const single = result.baseIngredientId !== null
  const raw = rawWord(cooking.kind)
  const name = portion.name.trim() || 'Без имени'
  const baseRaw = computed.share !== null ? baseRawGrams(result, computed.raw) : null
  const update = (patch: Partial<Omit<Portion, 'id' | 'weighingId'>>) => updatePortion(cooking.id, portion.id, patch)

  const remove = () => {
    const index = cooking.portions.findIndex((p) => p.id === portion.id)
    removePortion(cooking.id, portion.id)
    toast('Удалено', {
      description: portion.name.trim() || undefined,
      duration: 5000,
      action: { label: 'Отменить', onClick: () => restorePortion(cooking.id, portion, index) },
    })
  }

  // Own portion ⇄ share: grams keep today's amount, a share gets the others' average.
  const toggleMode = () => {
    if (input.basis === 'share') update({ input: convertPortionInput(result, portion.id, options[0].basis) })
    else update({ input: { basis: 'share', weight: defaultShareWeight(shareWeights(phasePortions)) } })
  }

  const setBasis = (key: string) => {
    const option = options.find((o) => o.key === key)
    if (option) update({ input: convertPortionInput(result, portion.id, option.basis) })
  }

  // A percent portion (from the calculator) is edited here as grams: the first change makes it grams.
  const gramsInput =
    input.basis === 'share' ? null : input.basis === 'part' ? convertPortionInput(result, portion.id, options[0].basis) : input
  const selected = gramsInput ? (options.find((o) => o.key === basisKey(gramsInput))?.key ?? '') : ''
  const selectedLabel = options.find((o) => o.key === selected)?.label
  const fill = input.basis === 'share' ? null : fillRemainder(cooking, result, portion.id)
  // Under the name: the raw counterpart (single ingredient) and whether the portion is the person's own.
  const subline = [
    single && baseRaw !== null && computed.cookedGrams !== null && `${formatGrams(baseRaw)} г ${raw}`,
    input.basis !== 'share' && 'своя порция',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Collapsible defaultOpen={isNew} className="group/person flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto min-h-14 min-w-0 flex-1 items-center justify-between gap-3 px-2 py-2 text-left font-normal whitespace-normal"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-base font-medium">{name}</span>
              {subline && <span className="text-sm text-muted-foreground">{subline}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {computed.cookedGrams !== null ? (
                <span className="text-2xl font-semibold tabular-nums whitespace-nowrap">
                  {formatGrams(computed.cookedGrams)}
                  <span className="ml-0.5 text-base font-normal text-muted-foreground">г</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {computed.issue ? ISSUE_TEXT[computed.issue] : baseRaw !== null && `${formatGrams(baseRaw)} г ${raw}`}
                </span>
              )}
              <ChevronDownIcon className="text-muted-foreground transition-transform group-data-[state=open]/person:rotate-180" />
            </span>
          </Button>
        </CollapsibleTrigger>
        <CopyButton
          label={`Скопировать для трекера: ${name}`}
          disabled={computed.share === null}
          getText={() => rawAmountsCopyText(cooking, computed.raw) || null}
        />
      </div>

      {!single && computed.share !== null && (
        <div className="px-2">
          <RawList cooking={cooking} raw={computed.raw} />
        </div>
      )}

      <CollapsibleContent className="flex flex-col gap-3 px-2 pb-2">
        <Input
          aria-label="Имя"
          placeholder="Имя"
          autoFocus={isNew}
          enterKeyHint="next"
          value={portion.name}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            focusOrBlur(portionGramsId(portion.id))
          }}
          onChange={(e) => update({ name: e.target.value })}
        />
        <Button variant="outline" className="justify-between font-normal" onClick={toggleMode}>
          {input.basis === 'share' ? 'Делит на всех' : 'Своя порция в граммах'}
          <ArrowLeftRightIcon className="opacity-50" />
        </Button>

        {!gramsInput ? (
          <NumberField
            id={portionGramsId(portion.id)}
            label="Доля"
            suffix=""
            value={input.basis === 'share' ? input.weight : null}
            validate={weightError}
            onValueChange={(weight) => weight !== null && update({ input: { basis: 'share', weight } })}
            onEnter={() => focusOrBlur(null)}
          />
        ) : (
          <div className="flex items-start gap-2">
            <NumberField
              className="w-32 shrink-0"
              id={portionGramsId(portion.id)}
              ariaLabel={`Порция, ${name}`}
              value={gramsInput.grams}
              onValueChange={(grams) => update({ input: { ...gramsInput, grams } })}
              onEnter={() => focusOrBlur(null)}
            />
            {options.length === 2 ? (
              // Two units: one tap switches between them, no dropdown.
              <Button
                variant="outline"
                className="min-w-0 flex-1 justify-between font-normal"
                aria-label={`В чём вводить, ${name}: ${selectedLabel ?? 'не выбрано'}. Переключить`}
                onClick={() => setBasis((options.find((o) => o.key !== selected) ?? options[0]).key)}
              >
                <span className="truncate">{selectedLabel ?? 'в чём вводить?'}</span>
                <ArrowLeftRightIcon className="opacity-50" />
              </Button>
            ) : (
              <Select value={selected} onValueChange={setBasis}>
                <SelectTrigger className="min-w-0 flex-1" aria-label={`В чём вводить, ${name}`}>
                  <SelectValue placeholder="в чём вводить?" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {fill !== null && gramsInput && (
            <Button variant="secondary" onClick={() => update({ input: { ...gramsInput, grams: fill } })}>
              Остаток
            </Button>
          )}
          <Button variant="ghost" className="text-destructive" onClick={remove}>
            <Trash2Icon data-icon="inline-start" />
            Убрать
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
