import { ChevronDownIcon, PlusIcon, ScaleIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
  baseRawGrams,
  basisKey,
  canReweigh,
  defaultShareWeight,
  formatGrams,
  ingredientNames,
  portionBasisOptions,
  shareWeights,
  type Cooking,
  type CookingResult,
  type Id,
  type PhaseResult,
} from '@/domain'
import { useAppStore } from '@/store/store'
import { CompanyPicker } from './CompanyPicker'
import { EqualSplit } from './EqualSplit'
import { rawWord } from './messages'
import { PastPhase } from './PastPhase'
import { PersonRow, type BasisOption } from './PersonRow'
import { RawList } from './RawList'
import { ReconcileStatus } from './ReconcileStatus'

interface PeopleSectionProps {
  cooking: Cooking
  result: CookingResult
  onReweigh: () => void
}

/**
 * «Кто ест»: the company of today and what each person gets. Reconciliation, the pot, equal split
 * and re-weighing are folded under «Подробнее».
 */
export function PeopleSection({ cooking, result, onReweigh }: PeopleSectionProps) {
  const setCookingCompany = useAppStore((s) => s.setCookingCompany)
  const addPortion = useAppStore((s) => s.addPortion)
  const [addedId, setAddedId] = useState<Id | null>(null)
  const phase = result.phases.at(-1)
  if (!phase) return null

  const single = result.baseIngredientId !== null
  const raw = rawWord(cooking.kind)
  const names = ingredientNames(cooking)
  const options: BasisOption[] = portionBasisOptions(result).map((basis) => ({
    key: basisKey(basis),
    basis,
    label: basis.basis === 'cooked' ? 'готовый' : single ? (cooking.kind === 'simple' ? 'сухой' : 'сырой') : `сырой: ${names.get(basis.ingredientId)}`,
  }))

  const rowsOf = (ph: PhaseResult) => {
    const phasePortions = cooking.portions.filter((p) => ph.portions.some((c) => c.portionId === p.id))
    return ph.portions.flatMap((computed, index) => {
      const portion = phasePortions.find((p) => p.id === computed.portionId)
      if (!portion) return []
      return [
        <div key={portion.id} className="flex flex-col gap-2">
          {index > 0 && <Separator />}
          <PersonRow
            cooking={cooking}
            result={result}
            portion={portion}
            computed={computed}
            phasePortions={phasePortions}
            options={options}
            isNew={portion.id === addedId}
          />
        </div>,
      ]
    })
  }

  const currentPortions = cooking.portions.filter((p) => phase.portions.some((c) => c.portionId === p.id))
  const addPerson = () =>
    setAddedId(addPortion(cooking.id, '', { basis: 'share', weight: defaultShareWeight(shareWeights(currentPortions)) }))

  const { remainder } = phase
  const potRaw = baseRawGrams(result, remainder.raw)
  const hasCounted = result.countedIngredientIds.length > 0

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Кто ест</h2>
        {phase.foodGrams === null && (
          <p className="text-sm text-muted-foreground">Взвесьте готовое — появится, сколько класть каждому.</p>
        )}
      </div>
        <CompanyPicker className="w-full sm:w-auto" value={cooking.companyId} onChange={(company) => setCookingCompany(cooking.id, company.id)} />

        {result.phases.slice(0, -1).map(
          (past, index) =>
            past.portions.length > 0 && (
              <PastPhase
                key={past.weighingId}
                label={`Этап ${index + 1} · ${cooking.portions
                  .filter((p) => past.portions.some((c) => c.portionId === p.id))
                  .map((p) => p.name.trim() || 'Без имени')
                  .join(', ')}`}
              >
                {rowsOf(past)}
              </PastPhase>
            ),
        )}

        {rowsOf(phase)}

        <Button variant="outline" className="self-start" onClick={addPerson}>
          <PlusIcon data-icon="inline-start" />
          Человек
        </Button>

        {hasCounted && (
          <Collapsible className="group/details flex flex-col gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="justify-between px-2">
                Подробнее
                <ChevronDownIcon className="transition-transform group-data-[state=open]/details:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-4">
              {phase.reconcile && <ReconcileStatus reconcile={phase.reconcile} kind={cooking.kind} />}

              {remainder.state === 'none' && <p className="text-sm">В кастрюле ничего не осталось</p>}
              {remainder.state === 'some' && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm">
                    В кастрюле:{' '}
                    {remainder.cookedGrams !== null && (
                      <span className="font-medium">{formatGrams(remainder.cookedGrams)} г готового</span>
                    )}
                    {potRaw !== null && remainder.cookedGrams !== null && ' = '}
                    {potRaw !== null && (
                      <span className="font-medium">
                        {formatGrams(potRaw)} г {raw}
                      </span>
                    )}
                  </p>
                  {!single && <RawList cooking={cooking} raw={remainder.raw} />}
                </div>
              )}

              {phase.foodGrams !== null && remainder.state === 'some' && <EqualSplit cooking={cooking} result={result} />}

              <Button variant="outline" disabled={!canReweigh(result)} onClick={onReweigh}>
                <ScaleIcon data-icon="inline-start" />
                Перевзвесить остаток
              </Button>
              {!canReweigh(result) && remainder.state !== 'some' && (
                <p className="text-sm text-muted-foreground">
                  Чтобы оставить часть на потом, задайте людям свои порции в граммах.
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
    </section>
  )
}
