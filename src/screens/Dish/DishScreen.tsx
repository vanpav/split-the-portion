import { PencilIcon, SoupIcon, Trash2Icon } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { dishEditPath, dishListPath, dishPath, newDishPath } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
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
import { ItemGroup } from '@/components/ui/item'
import { dishTitle, formatGrams } from '@/domain'
import { useAppStore } from '@/store/store'
import { CookingHistoryItem } from './CookingHistoryItem'

/** A dish's history: how it usually goes, its saved cookings, rare actions. */
export function DishScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dish = useAppStore((s) => s.dishes.find((d) => d.id === id))
  const allCookings = useAppStore((s) => s.cookings)
  const tares = useAppStore((s) => s.tares)
  const deleteDish = useAppStore((s) => s.deleteDish)

  if (!dish) return <Navigate to="/" replace />
  const title = dishTitle(dish)
  const cookings = allCookings
    .filter((c) => c.dishId === dish.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const tare = tares.find((t) => t.id === dish.tareId)
  const simple = dish.kind === 'simple'

  const weights = dish.ingredients
    .filter((i) => i.rawGrams !== null)
    .map((i) => (simple ? `${formatGrams(i.rawGrams!)} г сухого` : `${i.name} ${formatGrams(i.rawGrams!)} г`))
  const usual = [...weights, tare ? `в «${tare.name}»` : 'без тары'].join(' · ')

  const remove = () => {
    deleteDish(dish.id)
    navigate(dishListPath(dish.kind), { replace: true })
  }

  return (
    <>
      <ScreenHeader
        title={title}
        back
        backTo={dishPath(dish.id)}
        backLabel="Калькулятор"
        action={
          <Button variant="ghost" size="icon" asChild>
            <Link to={dishEditPath(dish.id)} aria-label="Изменить блюдо">
              <PencilIcon />
            </Link>
          </Button>
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4">
        <p className="text-base text-muted-foreground">Обычно: {usual}</p>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Готовки</h2>
          {cookings.length > 0 ? (
            <ItemGroup className="gap-2">
              {cookings.map((c) => (
                <CookingHistoryItem key={c.id} cooking={c} />
              ))}
            </ItemGroup>
          ) : (
            <p className="text-sm text-muted-foreground">Пока пусто: в калькуляторе нажмите «Сохранить».</p>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          {simple && (
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
                <AlertDialogDescription>
                  Блюдо и все его готовки ({cookings.length}) удалятся без возможности восстановить.
                </AlertDialogDescription>
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

      </main>
    </>
  )
}
