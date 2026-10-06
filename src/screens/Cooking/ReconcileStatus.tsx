import { CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatGrams, type CookingKind, type Reconciliation } from '@/domain'
import { rawWord } from './messages'

/** «Распределено X из Y г сырого»; red with the difference when the sum is off (docs/SPEC.md §5). */
export function ReconcileStatus({ reconcile, kind }: { reconcile: Reconciliation; kind: CookingKind }) {
  const unit = reconcile.basis === 'raw' ? `г ${rawWord(kind)}` : 'г готового'
  const summary = `Распределено ${formatGrams(reconcile.distributed)} из ${formatGrams(reconcile.total)} ${unit}`
  const diff = formatGrams(Math.abs(reconcile.diff))

  const view = {
    ok: { title: summary, Icon: CircleCheckIcon, error: false },
    over: { title: `Перебор ${diff} г`, Icon: TriangleAlertIcon, error: true },
    under: { title: `Не распределено ${diff} г`, Icon: TriangleAlertIcon, error: true },
    incomplete: { title: `Осталось распределить ${diff} г`, Icon: InfoIcon, error: false },
  }[reconcile.status]

  return (
    <div aria-live="polite">
      <Alert variant={view.error ? 'destructive' : 'default'}>
        <view.Icon />
        <AlertTitle>{view.title}</AlertTitle>
        {reconcile.status !== 'ok' && <AlertDescription>{summary}</AlertDescription>}
      </Alert>
    </div>
  )
}
