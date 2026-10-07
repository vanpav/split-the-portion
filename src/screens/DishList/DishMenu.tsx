import { ListPlusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { dishPath, newDishPath, newDishWithTextPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { DishSearch } from '@/components/DishSearch/DishSearch'
import { DishSearchGroup } from '@/components/DishSearch/DishSearchGroup'
import { DishSearchRow } from '@/components/DishSearch/DishSearchRow'
import { Button } from '@/components/ui/button'
import {
  createDishText,
  dishMenu,
  dishRow,
  dishSummary,
  localDay,
  missingPresets,
  presetDish,
  type PresetDish,
} from '@/domain'
import { addAllPresets } from '@/lib/addAllPresets'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'

const presetValue = (preset: PresetDish) => `preset:${preset.name}`
const CREATE_VALUE = 'create'

/** When a popular dish is added: its createdAt and updatedAt (it goes first on the shelf). */
const nowIso = () => new Date().toISOString()

/**
 * The dish menu's search and list (docs/UX.md «Меню блюд»): «Часто готовите», the other own dishes,
 * the popular ones to add, «Создать «…»» while something is typed. With no dishes it is the first
 * screen: «Добавить блюдо» and the whole catalogue at once.
 */
export function DishMenu() {
  const navigate = useNavigate()
  const dishes = useAppStore((s) => s.dishes)
  const addDishes = useAppStore((s) => s.addDishes)
  const deleteDish = useAppStore((s) => s.deleteDish)
  const { back, hasPrevious, noPreviousState } = useBack('/')
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  // Today for «Часто готовите», fixed while the menu is open.
  const [today] = useState(() => localDay(new Date()))
  const { often, rest, popular } = dishMenu(dishes, missingPresets(dishes), { query, today })
  const typed = query.trim() !== ''
  const createText = createDishText(dishes, query)
  const noDishes = dishes.length === 0
  const nothing = often.length + rest.length + popular.length === 0

  // Typing replaces the entry: «назад» leaves the menu, not each letter. Opened by a direct link,
  // the menu still has no previous screen of the app (useBack).
  const update = (q: string) =>
    setParams(q ? { q } : {}, { replace: true, preventScrollReset: true, state: hasPrevious ? undefined : noPreviousState })

  const add = (preset: PresetDish) => {
    const dish = presetDish(preset, newId, nowIso())
    addDishes([dish])
    navigate(dishPath(dish.id))
    toast('Блюдо добавлено', {
      description: `${preset.name} · ${dishSummary(dish.ingredients)}`,
      action: { label: 'Отменить', onClick: () => deleteDish(dish.id) },
    })
  }

  const values = [
    ...often.map((d) => d.id),
    ...rest.map((d) => d.id),
    ...popular.map(presetValue),
    ...(createText ? [CREATE_VALUE] : []),
  ]

  const ownRows = (list: typeof rest) =>
    list.map((dish) => (
      <DishSearchRow key={dish.id} value={dish.id} row={dishRow(dish, query)} query={query} onSelect={() => navigate(dishPath(dish.id))} />
    ))

  return (
    <DishSearch
      query={query}
      onQueryChange={update}
      onClose={back}
      placeholder="Гречка, суп…"
      values={values}
      before={
        noDishes &&
        !typed && (
          <div className="flex flex-col gap-2 pt-2">
            <h2 className="text-lg font-semibold">Пока нет блюд</h2>
            <p className="text-muted-foreground">
              Добавьте блюдо один раз — дальше у плиты вводите только готовый вес.
            </p>
            <Button size="lg" className="mt-2 h-12 w-full text-base" asChild>
              <Link to={newDishPath()}>
                <PlusIcon data-icon="inline-start" />
                Добавить блюдо
              </Link>
            </Button>
          </div>
        )
      }
      after={
        noDishes &&
        !typed &&
        popular.length > 0 && (
          <Button variant="outline" size="lg" className="mt-2 h-12 w-full text-base" onClick={addAllPresets}>
            <ListPlusIcon data-icon="inline-start" />
            {`Добавить все ${popular.length}`}
          </Button>
        )
      }
    >
      {typed && nothing && <p className="py-4 text-center text-sm text-muted-foreground">Ничего не нашлось</p>}
      {often.length > 0 && <DishSearchGroup heading="Часто готовите">{ownRows(often)}</DishSearchGroup>}
      {rest.length > 0 && (
        <DishSearchGroup
          heading={typed ? 'Ваши блюда' : often.length > 0 ? 'Остальные · по алфавиту' : 'Ваши блюда · по алфавиту'}
        >
          {ownRows(rest)}
        </DishSearchGroup>
      )}
      {popular.length > 0 && (
        <DishSearchGroup heading={noDishes ? (typed ? 'Популярные' : 'Или возьмите из популярных') : 'Добавить из популярных'}>
          {popular.map((preset) => (
            <DishSearchRow
              key={preset.name}
              value={presetValue(preset)}
              row={dishRow(preset, query)}
              query={query}
              mark="add"
              onSelect={() => add(preset)}
            />
          ))}
        </DishSearchGroup>
      )}
      {createText && (
        <DishSearchRow
          value={CREATE_VALUE}
          row={{ title: `Создать «${createText}»`, second: 'Откроется форма с этим словом', foundBy: false }}
          query={query}
          mark="create"
          onSelect={() => navigate(newDishWithTextPath(createText))}
        />
      )}
    </DishSearch>
  )
}
