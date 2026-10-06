import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { dishHistoryPath } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import { cookingWarnings, dayLabel, type Id } from '@/domain'
import { useCooking, useCookingResult } from '@/store/hooks'
import { useAppStore } from '@/store/store'
import { PeopleSection } from './PeopleSection'
import { TodayFields } from './TodayFields'
import { WeighingSection } from './WeighingSection'

/** Fast screen at the stove: today's raw weight, the weight after cooking, what each person gets. */
export function CookingScreen() {
  const { id } = useParams()
  const cooking = useCooking(id)
  const result = useCookingResult(id)
  const addReweighing = useAppStore((s) => s.addReweighing)
  const updateIngredient = useAppStore((s) => s.updateIngredient)
  const [newWeighingId, setNewWeighingId] = useState<Id | null>(null)
  const [now] = useState(() => new Date())
  const warnings = useMemo(() => (cooking && result ? cookingWarnings(cooking, result) : []), [cooking, result])

  if (!cooking || !result) return <Navigate to="/" replace />

  return (
    <>
      <ScreenHeader
        title={`${cooking.title} · ${dayLabel(cooking.createdAt, now)}`}
        back
        backTo={dishHistoryPath(cooking.dishId)}
        backLabel="История"
      />
      <main className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-8 p-4 lg:grid-cols-2 lg:items-start lg:gap-12 lg:py-8">
        <div className="flex min-w-0 flex-col gap-8">
          <WeighingSection cooking={cooking} result={result} warnings={warnings} focusWeighingId={newWeighingId}>
            <TodayFields
              kind={cooking.kind}
              ingredients={cooking.ingredients}
              onChange={(ingredientId, rawGrams) => updateIngredient(cooking.id, ingredientId, { rawGrams })}
            />
          </WeighingSection>
        </div>
        <div className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-20">
          <PeopleSection
            cooking={cooking}
            result={result}
            onReweigh={() => setNewWeighingId(addReweighing(cooking.id))}
          />
        </div>
      </main>
    </>
  )
}
