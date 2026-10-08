import { ListChecksIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { dishPath, newDishPath, newDishWithTextPath, POPULAR_PATH } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { DishSearch } from '@/components/DishSearch/DishSearch'
import { DishSearchGroup } from '@/components/DishSearch/DishSearchGroup'
import { DishSearchRow } from '@/components/DishSearch/DishSearchRow'
import { Highlight } from '@/components/DishSearch/Highlight'
import { Button } from '@/components/ui/button'
import {
  categoryMatches,
  createDishText,
  dishCategory,
  dishMenu,
  localDay,
  missingPresets,
  presetDish,
  type PresetDish,
} from '@/domain'
import { newId } from '@/store/id'
import { usePrefsStore } from '@/store/prefs'
import { useAppStore } from '@/store/store'
import { t } from '@/i18n'
import { categoryLabel, dishRow } from '@/i18n/format'

const presetValue = (preset: PresetDish) => `preset:${preset.name}`
const CREATE_VALUE = 'create'

/** When a popular dish is added: its createdAt and updatedAt (it goes first on the shelf). */
const nowIso = () => new Date().toISOString()

/**
 * The dish menu's search and list (docs/UX.md «Меню блюд»): «Часто готовишь», the other own dishes
 * (or, with «По категориям», the own dishes in sections by category),
 * the popular ones to add, «Создать «…»» while something is typed. With no dishes it is the first
 * screen: «Добавить блюдо», the catalogue and «Выбрать из популярных» (the picker screen).
 */
export function DishMenu() {
  const navigate = useNavigate()
  const dishes = useAppStore((s) => s.dishes)
  const addDishes = useAppStore((s) => s.addDishes)
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

  // No toast: the dish opens at once, that is the result (docs/UX.md §3а «Тосты — редко»).
  const add = (preset: PresetDish) => {
    const dish = presetDish(preset, newId, nowIso())
    addDishes([dish])
    navigate(dishPath(dish.id))
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
      placeholder={t('common.searchPlaceholder')}
      values={values}
      grouping={{ on: byCategory, onToggle: () => setByCategory(!byCategory) }}
      before={
        noDishes &&
        !typed && (
          <div className="flex flex-col gap-2 pt-2">
            <h2 className="text-lg font-semibold">{t('dishes.menu.emptyTitle')}</h2>
            <p className="text-muted-foreground">
              {t('dishes.menu.emptyText')}
            </p>
            <Button size="lg" className="mt-2 h-12 w-full text-base" asChild>
              <Link to={newDishPath()}>
                <PlusIcon data-icon="inline-start" />
                {t('dishes.menu.add')}
              </Link>
            </Button>
          </div>
        )
      }
      after={
        noDishes &&
        !typed &&
        popular.length > 0 && (
          <Button variant="outline" size="lg" className="mt-2 h-12 w-full text-base" asChild>
            <Link to={POPULAR_PATH}>
              <ListChecksIcon data-icon="inline-start" />
              {t('dishes.menu.fromPopular')}
            </Link>
          </Button>
        )
      }
    >
      {typed && nothing && <p className="py-4 text-center text-sm text-muted-foreground">{t('common.nothingFound')}</p>}
      {categories.map(({ category, dishes: list }) => (
        <DishSearchGroup
          key={category}
          heading={categoryMatches(query, category) ? <Highlight text={categoryLabel(category)} query={query} /> : categoryLabel(category)}
          count={list.length}
        >
          {ownRows(list, true)}
        </DishSearchGroup>
      ))}
      {often.length > 0 && <DishSearchGroup heading={t('dishes.menu.often')}>{ownRows(often)}</DishSearchGroup>}
      {rest.length > 0 && (
        <DishSearchGroup
          heading={t(typed ? 'dishes.menu.yours' : often.length > 0 ? 'dishes.menu.restAbc' : 'dishes.menu.yoursAbc')}
        >
          {ownRows(rest)}
        </DishSearchGroup>
      )}
      {popular.length > 0 && (
        <DishSearchGroup heading={t(noDishes ? (typed ? 'dishes.menu.popular' : 'dishes.menu.orPopular') : 'dishes.menu.addPopular')}>
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
          row={{ title: t('dishes.menu.create', { text: createText }), second: t('dishes.menu.createHint'), foundBy: false }}
          query={query}
          mark="create"
          onSelect={() => navigate(newDishWithTextPath(createText))}
        />
      )}
    </DishSearch>
  )
}
