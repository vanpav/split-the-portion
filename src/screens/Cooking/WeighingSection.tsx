import { Trash2Icon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  baseRawGrams,
  dayLabel,
  formatGrams,
  type Cooking,
  type CookingResult,
  type CookingWarning,
  type Id,
} from '@/domain'
import { useAppStore } from '@/store/store'
import { kText, rawWord } from './messages'
import { PastPhase } from './PastPhase'
import { WeighingEditor } from './WeighingEditor'

interface WeighingSectionProps {
  cooking: Cooking
  result: CookingResult
  warnings: CookingWarning[]
  /** Re-weighing just added: its field gets the focus. */
  focusWeighingId: Id | null
  /** Today's raw weights: in the same row as the first weighing. */
  children?: ReactNode
}

/** Today's raw weights and the weighings; past weighings collapsed, the current one open. */
export function WeighingSection({ cooking, result, warnings, focusWeighingId, children }: WeighingSectionProps) {
  const removeWeighing = useAppStore((s) => s.removeWeighing)
  const [confirming, setConfirming] = useState(false)
  const disabled = cooking.ingredients.length === 0
  // «сегодня / вчера» is relative to when the screen was opened.
  const [now] = useState(() => new Date())

  const phases = cooking.weighings.flatMap((weighing, index) => {
    const phase = result.phases[index]
    if (!phase) return []
    const availableRaw = index > 0 ? baseRawGrams(result, result.phases[index - 1].remainder.raw) : null
    return [{ weighing, phase, index, availableRaw }]
  })
  const current = phases.at(-1)
  const editorProps = (p: (typeof phases)[number]) => ({
    cookingId: cooking.id,
    weighing: p.weighing,
    phase: p.phase,
    warnings,
    leftover: p.index > 0,
    availableRaw: p.availableRaw,
    rawUnit: rawWord(cooking.kind),
  })

  const removeCurrent = () => {
    if (current) removeWeighing(cooking.id, current.weighing.id)
    setConfirming(false)
  }
  const currentPortions = current?.phase.portions.length ?? 0

  return (
    <section className="flex flex-col gap-3" aria-label="Взвешивание">
      {disabled && <p className="text-sm text-muted-foreground">В рецепте нет ингредиентов.</p>}
      {!disabled && current && (
        <>
          {phases.slice(0, -1).map((p) => (
            <PastPhase
              key={p.weighing.id}
              label={[
                `Этап ${p.index + 1}`,
                dayLabel(p.weighing.at, now),
                p.phase.foodGrams !== null ? `${formatGrams(p.phase.foodGrams)} г` : 'вес не введён',
                p.phase.k && kText(p.phase.k, p.index > 0),
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              <WeighingEditor key={p.weighing.id} {...editorProps(p)} before={p.index === 0 ? children : undefined} />
            </PastPhase>
          ))}

          {current.index > 0 && (
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">
                Этап {current.index + 1} · остаток · {dayLabel(current.weighing.at, now)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Удалить перевзвешивание"
                onClick={() => (currentPortions > 0 ? setConfirming(true) : removeCurrent())}
              >
                <Trash2Icon />
              </Button>
            </div>
          )}
          <WeighingEditor
            key={current.weighing.id}
            {...editorProps(current)}
            autoFocus={current.weighing.id === focusWeighingId}
            before={current.index === 0 ? children : undefined}
          />

          <AlertDialog open={confirming} onOpenChange={setConfirming}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить перевзвешивание?</AlertDialogTitle>
                <AlertDialogDescription>
                  Порции этого этапа ({currentPortions}) удалятся вместе с ним. Порции прошлых этапов останутся.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={removeCurrent}>
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </section>
  )
}
