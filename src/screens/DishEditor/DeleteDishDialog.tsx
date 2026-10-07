import { useNavigate } from 'react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { dishTitle, type Dish } from '@/domain'
import { useAppStore } from '@/store/store'

interface DeleteDishDialogProps {
  dish: Dish
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** «Удалить блюдо» from the editor's «⋯»: asks first, then removes it and goes to the calculator. */
export function DeleteDishDialog({ dish, open, onOpenChange }: DeleteDishDialogProps) {
  const navigate = useNavigate()
  const deleteDish = useAppStore((s) => s.deleteDish)

  const remove = () => {
    deleteDish(dish.id)
    navigate('/', { replace: true })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить «{dishTitle(dish)}»?</AlertDialogTitle>
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
  )
}
