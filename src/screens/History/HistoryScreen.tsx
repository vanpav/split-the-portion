import { useState } from 'react'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ItemGroup } from '@/components/ui/item'
import { dayLabel, dishTitle, type Cooking } from '@/domain'
import { CookingHistoryItem } from '@/screens/Dish/CookingHistoryItem'
import { useAppStore } from '@/store/store'

/** Every saved cooking of every dish, newest first, by day (docs/UX.md): the way back to what was cooked. */
export function HistoryScreen() {
  const cookings = useAppStore((s) => s.cookings)
  const dishes = useAppStore((s) => s.dishes)
  const [now] = useState(() => new Date())

  const sorted = [...cookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  // Consecutive cookings of one day under one heading; the list is sorted, so a day is one run.
  const days: { label: string; cookings: Cooking[] }[] = []
  for (const c of sorted) {
    const label = dayLabel(c.createdAt, now)
    const last = days.at(-1)
    if (last?.label === label) last.cookings.push(c)
    else days.push({ label, cookings: [c] })
  }
  const titleOf = (c: Cooking) => {
    const dish = dishes.find((d) => d.id === c.dishId)
    return dish ? dishTitle(dish) : c.title || 'Без названия'
  }

  return (
    <>
      <ScreenHeader title="История" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        {days.length === 0 ? (
          <p className="text-muted-foreground">
            Готовок пока нет. Откройте блюдо, введите вес после готовки и нажмите «Сохранить».
          </p>
        ) : (
          days.map((day) => (
            <section key={day.label} className="flex flex-col gap-2">
              <h2 className="px-1 text-sm font-semibold text-muted-foreground first-letter:uppercase">{day.label}</h2>
              <ItemGroup className="gap-2">
                {day.cookings.map((c) => (
                  <CookingHistoryItem key={c.id} cooking={c} title={titleOf(c)} />
                ))}
              </ItemGroup>
            </section>
          ))
        )}
      </main>
    </>
  )
}
