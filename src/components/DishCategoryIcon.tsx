import { CakeSliceIcon, CupSodaIcon, DrumstickIcon, EggFriedIcon, SaladIcon, SoupIcon, UtensilsIcon, WheatIcon, type LucideIcon } from 'lucide-react'
import type { DishCategory } from '@/domain'
import { cn } from '@/lib/utils'

/** The one `category → icon` map (lucide, as the rest of the app). */
const ICONS: Record<DishCategory, LucideIcon> = {
  first: SoupIcon,
  mains: DrumstickIcon,
  sides: WheatIcon,
  salads: SaladIcon,
  breakfast: EggFriedIcon,
  baking: CakeSliceIcon,
  drinks: CupSodaIcon,
  other: UtensilsIcon,
}

/**
 * The icon of a dish category, in front of the dish: in the search rows and on the shelf chips. It only
 * decorates (the category is said in words elsewhere), so it is hidden from screen readers. The color
 * is the text color of the slot: `className` sets the slot's size and color.
 */
export function DishCategoryIcon({ category, className }: { category: DishCategory; className?: string }) {
  const Icon = ICONS[category]
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center text-muted-foreground', className)}>
      <Icon className="size-full" />
    </span>
  )
}
