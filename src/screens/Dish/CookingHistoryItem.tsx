import { Trash2Icon } from 'lucide-react'
import { Fragment, useMemo } from 'react'
import { Link } from 'react-router'
import { cookingPath } from '@/app/paths'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { computeCooking, formatGrams, formatK, leftoverCookedGrams, type Cooking } from '@/domain'
import { rawWord } from '@/screens/Cooking/messages'
import { useAppStore } from '@/store/store'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

interface CookingHistoryItemProps {
  cooking: Cooking
  /** The dish name, for the history of all dishes; the day is then the list's heading, the time is here. */
  title?: string
}

/** One past cooking: when (or which dish, at what time), how much dry and cooked, k, leftover. */
export function CookingHistoryItem({ cooking, title }: CookingHistoryItemProps) {
  const deleteCooking = useAppStore((s) => s.deleteCooking)
  const result = useMemo(() => computeCooking(cooking), [cooking])
  const phase = result.phases[0]
  const leftover = leftoverCookedGrams(result)
  const date = dateFormat.format(new Date(cooking.createdAt))
  const summary = [
    title && timeFormat.format(new Date(cooking.createdAt)),
    result.rawTotal > 0 && `${formatGrams(result.rawTotal)} г ${rawWord(cooking.kind)}`,
    phase?.foodGrams != null ? `${formatGrams(phase.foodGrams)} г готового` : 'без готового веса',
    phase?.k && `k ${formatK(phase.k.value)}`,
    leftover !== null && `остаток ${formatGrams(leftover)} г`,
  ].filter((part): part is string => Boolean(part))

  return (
    <Item variant="outline" role="listitem" className="relative">
      <ItemContent>
        <ItemTitle>
          <Link to={cookingPath(cooking.id)} className="outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50">
            {title ?? date}
          </Link>
        </ItemTitle>
        <ItemDescription>
          {/* Each part stays whole («k 2,8», «560 г готового»); the line wraps only between parts, the dot stays at the line's end. */}
          {summary.map((part, i) => (
            <Fragment key={part}>
              {i > 0 && ' '}
              <span className="whitespace-nowrap">
                {part}
                {i < summary.length - 1 && ' ·'}
              </span>
            </Fragment>
          ))}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="relative z-10">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Удалить готовку ${date}`}>
              <Trash2Icon />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить готовку {date}?</AlertDialogTitle>
              <AlertDialogDescription>Взвешивания и порции этой готовки удалятся. Блюдо останется.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => deleteCooking(cooking.id)}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ItemActions>
    </Item>
  )
}
