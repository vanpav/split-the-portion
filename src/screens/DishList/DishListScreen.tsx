import { BookOpenIcon, CookingPotIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { newDishPath, settingsPath } from '@/app/paths'
import { MoreMenu } from '@/components/MoreMenu'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ItemGroup } from '@/components/ui/item'
import { recentDishes } from '@/domain'
import { useAppStore } from '@/store/store'
import { DishListItem } from './DishListItem'
import { OpenGroupLink } from './OpenGroupLink'

/**
 * `#/dishes`: every dish in one list, the latest used first — from «Все блюда» on the dish shelf.
 * Adding one is in «⋯». With no dishes it is the first screen (`home`): there is no calculator to go
 * back to, and the empty state offers to add one.
 */
export function DishListScreen({ home }: { home?: boolean }) {
  const dishes = useAppStore((s) => s.dishes)
  const shown = recentDishes(dishes)

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
        {shown.length === 0 ? (
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
          <ItemGroup className="gap-2">
            {shown.map((dish) => (
              <DishListItem key={dish.id} dish={dish} />
            ))}
          </ItemGroup>
        )}
      </main>
    </>
  )
}
