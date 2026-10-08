import { BookOpenIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { newDishPath, POPULAR_PATH } from '@/app/paths'
import { MoreMenu } from '@/components/MoreMenu'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { missingPresets } from '@/domain'
import { useAppStore } from '@/store/store'
import { DishMenu } from './DishMenu'
import { OpenGroupLink } from './OpenGroupLink'
import { t } from '@/i18n'

/**
 * `#/dishes`: the dish menu — one search over the user's dishes and the popular ones they do not have
 * yet (docs/UX.md «Меню блюд»). The text is in the address, so «назад» from a dish comes back to the
 * same menu. With no dishes it is the first screen (`home`): the same list, with «Добавить блюдо» on top.
 * «Добавить популярные блюда» is in «⋯» while some are still missing: it opens the picker screen.
 */
export function DishMenuScreen({ home }: { home?: boolean }) {
  // With no dishes the list starts with a large «Добавить блюдо»: no second one in the header.
  const hasDishes = useAppStore((s) => s.dishes.length > 0)
  const somePopularMissing = useAppStore((s) => missingPresets(s.dishes).length > 0)
  return (
    <>
      <ScreenHeader
        title={t('common.dishes')}
        back={!home}
        backTo="/"
        backLabel={t('common.calculator')}
        action={
          <>
            <OpenGroupLink />
            {hasDishes && (
              <Button variant="secondary" size="icon" className="size-11 shrink-0 rounded-full" aria-label={t('dishes.menu.add')} asChild>
                <Link to={newDishPath()}>
                  <PlusIcon />
                </Link>
              </Button>
            )}
            <MoreMenu
              items={
                hasDishes && somePopularMissing
                  ? [{ label: t('dishes.menu.addPopularDishes'), icon: BookOpenIcon, to: POPULAR_PATH }]
                  : []
              }
            />
          </>
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <DishMenu />
      </main>
    </>
  )
}
