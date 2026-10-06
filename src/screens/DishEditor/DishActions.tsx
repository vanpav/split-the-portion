import { SoupIcon, Trash2Icon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { newDishPath } from '@/app/paths'
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
import { dishTitle, type Dish } from '@/domain'
import { useAppStore } from '@/store/store'

/** Rare actions on a dish, at the end of its editor: a composite dish based on it, removing it. */
export function DishActions({ dish }: { dish: Dish }) {
  const navigate = useNavigate()
  const deleteDish = useAppStore((s) => s.deleteDish)
  const title = dishTitle(dish)

  const remove = () => {
    deleteDish(dish.id)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {dish.kind === 'simple' && (
        <Button variant="ghost" asChild>
          <Link to={newDishPath(dish.id)}>
            <SoupIcon data-icon="inline-start" />
            Составное на основе
          </Link>
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="text-destructive">
            <Trash2Icon data-icon="inline-start" />
            Удалить блюдо
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить «{title}»?</AlertDialogTitle>
            <AlertDialogDescription>Блюдо удалится вместе с тем, кто его ест и в каких долях. Вернуть не получится.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
