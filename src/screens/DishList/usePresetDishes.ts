import { useMemo } from 'react'
import { toast } from 'sonner'
import { presetDishes } from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'

/**
 * «Популярные блюда» (docs/UX.md «Меню блюд»): ready recipes added next to the user's own dishes,
 * never replacing them; ones with the same name are skipped. `add` offers «Отменить» in a toast.
 */
export function usePresetDishes() {
  const dishes = useAppStore((s) => s.dishes)
  const addDishes = useAppStore((s) => s.addDishes)
  const deleteDish = useAppStore((s) => s.deleteDish)

  // What would be added now: only names and kinds matter here, ids are made on adding.
  const missing = useMemo(() => presetDishes(dishes, () => '', ''), [dishes])
  const simple = missing.filter((d) => d.kind === 'simple').length

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

  return { missing: missing.length, simple, composite: missing.length - simple, add }
}
