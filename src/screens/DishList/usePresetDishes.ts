import { useMemo } from 'react'
import { presetDishes } from '@/domain'
import { addAllPresets } from '@/lib/addAllPresets'
import { useAppStore } from '@/store/store'

/**
 * «Популярные блюда» (docs/UX.md «Меню блюд»): ready recipes added next to the user's own dishes,
 * never replacing them; ones with the same name are skipped. `add` offers «Отменить» in a toast.
 */
export function usePresetDishes() {
  const dishes = useAppStore((s) => s.dishes)

  // What would be added now: only names and kinds matter here, ids are made on adding.
  const missing = useMemo(() => presetDishes(dishes, () => '', ''), [dishes])
  const simple = missing.filter((d) => d.kind === 'simple').length

  return { missing: missing.length, simple, composite: missing.length - simple, add: addAllPresets }
}
