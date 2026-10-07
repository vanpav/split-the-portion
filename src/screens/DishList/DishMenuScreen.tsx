import { BookOpenIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { newDishPath } from '@/app/paths'
import { MoreMenu } from '@/components/MoreMenu'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/store'
import { DishMenu } from './DishMenu'
import { OpenGroupLink } from './OpenGroupLink'
import { PresetDishesDialog } from './PresetDishesDialog'
import { usePresetDishes } from './usePresetDishes'

/**
 * `#/dishes`: the dish menu — one search over the user's dishes and the popular ones they do not have
 * yet (docs/UX.md «Меню блюд»). The text is in the address, so «назад» from a dish comes back to the
 * same menu. With no dishes it is the first screen (`home`): the same list, with «Добавить блюдо» on top.
 * «Добавить популярные блюда» is in «⋯» while some are still missing: asked first, since dishes exist.
 */
export function DishMenuScreen({ home }: { home?: boolean }) {
  // With no dishes the list starts with a large «Добавить блюдо»: no second one in the header.
  const hasDishes = useAppStore((s) => s.dishes.length > 0)
  const presets = usePresetDishes()
  const [askPresets, setAskPresets] = useState(false)
  return (
    <>
      <ScreenHeader
        title="Блюда"
        back={!home}
        backTo="/"
        backLabel="Калькулятор"
        action={
          <>
            <OpenGroupLink />
            {hasDishes && (
              <Button variant="secondary" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Добавить блюдо" asChild>
                <Link to={newDishPath()}>
                  <PlusIcon />
                </Link>
              </Button>
            )}
            <MoreMenu
              items={
                hasDishes && presets.missing > 0
                  ? [{ label: 'Добавить популярные блюда', icon: BookOpenIcon, onSelect: () => setAskPresets(true) }]
                  : []
              }
            />
          </>
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <DishMenu />
      </main>
      <PresetDishesDialog
        open={askPresets}
        onOpenChange={setAskPresets}
        simple={presets.simple}
        composite={presets.composite}
        onAdd={presets.add}
      />
    </>
  )
}
