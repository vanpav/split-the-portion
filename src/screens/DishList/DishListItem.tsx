import { Link } from 'react-router'
import { dishPath } from '@/app/paths'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { dishTitle, formatGrams, type Dish } from '@/domain'

export function DishListItem({ dish }: { dish: Dish }) {
  const title = dishTitle(dish)
  const counted = dish.ingredients.filter((i) => !i.excluded && i.name.trim())

  // Simple: its usual dry weight; composite: what it is made of.
  const product = counted[0]
  const summary =
    dish.kind === 'simple'
      ? product?.rawGrams != null && `${formatGrams(product.rawGrams)} г сухого`
      : counted.map((i) => i.name.trim()).join(', ')

  return (
    <Item variant="outline" role="listitem" className="relative">
      <ItemContent>
        <ItemTitle>
          {/* Stretched link: the whole row opens the dish's calculator. */}
          <Link to={dishPath(dish.id)} className="outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50">
            {title}
          </Link>
        </ItemTitle>
        {summary && <ItemDescription className="line-clamp-1">{summary}</ItemDescription>}
      </ItemContent>
    </Item>
  )
}
