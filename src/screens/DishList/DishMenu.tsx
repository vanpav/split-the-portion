import { ListPlusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { dishPath, newDishPath, newDishWithTextPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { DishSearch } from '@/components/DishSearch/DishSearch'
import { DishSearchGroup } from '@/components/DishSearch/DishSearchGroup'
import { DishSearchRow } from '@/components/DishSearch/DishSearchRow'
import { Highlight } from '@/components/DishSearch/Highlight'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_LABELS,
  categoryMatches,
  createDishText,
  dishCategory,
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
import { usePrefsStore } from '@/store/prefs'
import { useAppStore } from '@/store/store'

const presetValue = (preset: PresetDish) => `preset:${preset.name}`
const CREATE_VALUE = 'create'

/** When a popular dish is added: its createdAt and updatedAt (it goes first on the shelf). */
const nowIso = () => new Date().toISOString()

/**
 * The dish menu's search and list (docs/UX.md «Меню блюд»): «Часто готовишь», the other own dishes
 * (or, with «По категориям», the own dishes in sections by category),
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
  // Today for «Часто готовишь», fixed while the menu is open.
  const [today] = useState(() => localDay(new Date()))
  const byCategory = usePrefsStore((s) => s.dishesByCategory)
  const setByCategory = usePrefsStore((s) => s.setDishesByCategory)
  const { often, rest, categories, popular } = dishMenu(dishes, missingPresets(dishes), { query, today, byCategory })
  const typed = query.trim() !== ''
  const createText = createDishText(dishes, query)
  const noDishes = dishes.length === 0
  const nothing = often.length + rest.length + categories.length + popular.length === 0

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
    ...categories.flatMap((c) => c.dishes.map((d) => d.id)),
    ...popular.map(presetValue),
    ...(createText ? [CREATE_VALUE] : []),
  ]

  // Under a category heading a dish found by its category does not repeat it: the heading is marked.
  const ownRows = (list: typeof rest, underCategory = false) =>
    list.map((dish) => (
      <DishSearchRow
        key={dish.id}
        value={dish.id}
        row={dishRow(dish, query, { underCategory })}
        category={dishCategory(dish)}
        query={query}
        onSelect={() => navigate(dishPath(dish.id))}
      />
    ))

  return (
    <DishSearch
      query={query}
      onQueryChange={update}
      onClose={back}
      placeholder="Гречка, суп…"
      values={values}
      grouping={{ on: byCategory, onToggle: () => setByCategory(!byCategory) }}
      before={
        noDishes &&
        !typed && (
          <div className="flex flex-col gap-2 pt-2">
            <h2 className="text-lg font-semibold">Пока нет блюд</h2>
            <p className="text-muted-foreground">
              Добавь блюдо один раз — дальше у плиты вводи только готовый вес.
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
      {categories.map(({ category, dishes: list }) => (
        <DishSearchGroup
          key={category}
          heading={categoryMatches(query, category) ? <Highlight text={CATEGORY_LABELS[category]} query={query} /> : CATEGORY_LABELS[category]}
          count={list.length}
        >
          {ownRows(list, true)}
        </DishSearchGroup>
      ))}
      {often.length > 0 && <DishSearchGroup heading="Часто готовишь">{ownRows(often)}</DishSearchGroup>}
      {rest.length > 0 && (
        <DishSearchGroup
          heading={typed ? 'Твои блюда' : often.length > 0 ? 'Остальные · по алфавиту' : 'Твои блюда · по алфавиту'}
        >
          {ownRows(rest)}
        </DishSearchGroup>
      )}
      {popular.length > 0 && (
        <DishSearchGroup heading={noDishes ? (typed ? 'Популярные' : 'Или возьми из популярных') : 'Добавить из популярных'}>
          {popular.map((preset) => (
            <DishSearchRow
              key={preset.name}
              value={presetValue(preset)}
              row={dishRow(preset, query)}
              category={dishCategory(preset)}
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
