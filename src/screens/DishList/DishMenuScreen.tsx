import { BookOpenIcon, CookingPotIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { newDishPath, settingsPath } from '@/app/paths'
import { MoreMenu } from '@/components/MoreMenu'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useAppStore } from '@/store/store'
import { DishMenu } from './DishMenu'
import { OpenGroupLink } from './OpenGroupLink'

/**
 * `#/dishes`: the dish menu — search, kind and sort over the user's dishes, then the popular ones they do
 * not have yet (docs/UX.md «Меню блюд»). Everything on it is in the address, so «назад» from a dish
 * comes back to the same menu. With no dishes it is the first screen (`home`) with the empty state.
 */
export function DishMenuScreen({ home }: { home?: boolean }) {
  const dishes = useAppStore((s) => s.dishes)

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
            <MoreMenu items={[{ label: 'Добавить блюдо', to: newDishPath(), icon: PlusIcon }]} />
          </>
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        {dishes.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CookingPotIcon />
              </EmptyMedia>
              <EmptyTitle>Пока нет блюд</EmptyTitle>
              <EmptyDescription>
                Гречка, макароны, суп. Добавьте блюдо один раз — дальше у плиты вводите только готовый вес.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center">
              <Button size="lg" asChild>
                <Link to={newDishPath()}>
                  <PlusIcon data-icon="inline-start" />
                  Блюдо
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={settingsPath('presets')}>
                  <BookOpenIcon data-icon="inline-start" />
                  Популярные блюда
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <DishMenu />
        )}
      </main>
    </>
  )
}

