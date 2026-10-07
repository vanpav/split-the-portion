import { ListPlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { presetDishes } from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'

/**
 * «Популярные блюда»: ready recipes for a new user. Added next to the user's own dishes, never
 * replacing them; ones with the same name are skipped. With dishes already there — confirm first.
 */
export function PresetsSection() {
  const dishes = useAppStore((s) => s.dishes)
  const addDishes = useAppStore((s) => s.addDishes)
  const deleteDish = useAppStore((s) => s.deleteDish)
  // Counts shown in the dialog, kept while it closes (the list changes under it on «Добавить»).
  const [confirm, setConfirm] = useState({ open: false, simple: 0, composite: 0 })

  // What would be added now: only names and kinds matter here, ids are made on adding.
  const missing = useMemo(() => presetDishes(dishes, () => '', ''), [dishes])
  const simple = missing.filter((d) => d.kind === 'simple').length
  const composite = missing.length - simple

  const add = () => {
    const added = presetDishes(useAppStore.getState().dishes, newId, new Date().toISOString())
    if (added.length === 0) return
    addDishes(added)
    const addedSimple = added.filter((d) => d.kind === 'simple').length
    toast('Блюда добавлены', {
      description: `Простых: ${addedSimple}, составных: ${added.length - addedSimple}.`,
      duration: 8000,
      action: { label: 'Отменить', onClick: () => added.forEach((d) => deleteDish(d.id)) },
    })
  }

  const press = () => (dishes.length > 0 ? setConfirm({ open: true, simple, composite }) : add())

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold max-md:sr-only">Популярные блюда</h2>
        <p className="text-sm text-muted-foreground">
          Гречка, макароны, борщ, плов и другие — с обычным весом. Твои блюда останутся, их можно поправить
          или удалить.
        </p>
      </div>
      <Button variant="outline" disabled={missing.length === 0} onClick={press}>
        <ListPlusIcon data-icon="inline-start" />
        Добавить популярные блюда
      </Button>
      {missing.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">Все популярные блюда уже добавлены</p>
      )}

      <AlertDialog open={confirm.open} onOpenChange={(open) => setConfirm((c) => ({ ...c, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Добавить популярные блюда?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Добавятся простые блюда: ${confirm.simple}, составные: ${confirm.composite}. Твои блюда не изменятся, блюда с такими же названиями пропустим.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={add}>Добавить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
