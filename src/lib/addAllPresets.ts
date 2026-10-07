import { toast } from 'sonner'
import { presetDishes } from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'

/**
 * Adds every popular dish the user does not have yet (Settings → «Популярные блюда», the empty dish
 * menu): next to their own dishes, those with the same name are skipped. Toast with «Отменить».
 */
export function addAllPresets(): void {
  const { dishes, addDishes, deleteDish } = useAppStore.getState()
  const added = presetDishes(dishes, newId, new Date().toISOString())
  if (added.length === 0) return
  addDishes(added)
  const addedSimple = added.filter((d) => d.kind === 'simple').length
  toast('Блюда добавлены', {
    description: `Простых: ${addedSimple}, составных: ${added.length - addedSimple}.`,
    duration: 8000,
    action: { label: 'Отменить', onClick: () => added.forEach((d) => deleteDish(d.id)) },
  })
}
