import { CookingPotIcon, PlusIcon, SoupIcon } from 'lucide-react'
import { Link } from 'react-router'
import { newDishPath } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ItemGroup } from '@/components/ui/item'
import type { CookingKind, Dish } from '@/domain'
import { DishListItem } from './DishListItem'

const TEXT = {
  simple: {
    add: 'Простое блюдо',
    emptyTitle: 'Пока нет простых блюд',
    emptyDescription: 'Один продукт: гречка, макароны, картофель. Настройте один раз — потом вводите только сухой и готовый вес.',
    Icon: CookingPotIcon,
  },
  composite: {
    add: 'Составное блюдо',
    emptyTitle: 'Пока нет составных блюд',
    emptyDescription: 'Суп, плов, рагу: несколько ингредиентов, порция — с составом в сыром весе.',
    Icon: SoupIcon,
  },
} as const

/** One kind of dishes: the list, or an empty state with its «+» button. */
export function DishKindList({ kind, dishes }: { kind: CookingKind; dishes: Dish[] }) {
  const text = TEXT[kind]
  const addButton = () => (
    <Button size="lg" asChild>
      <Link to={newDishPath()}>
        <PlusIcon data-icon="inline-start" />
        {text.add}
      </Link>
    </Button>
  )

  if (dishes.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <text.Icon />
          </EmptyMedia>
          <EmptyTitle>{text.emptyTitle}</EmptyTitle>
          <EmptyDescription>{text.emptyDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>{addButton()}</EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ItemGroup className="gap-2">
        {dishes.map((dish) => (
          <DishListItem key={dish.id} dish={dish} />
        ))}
      </ItemGroup>
    </div>
  )
}
