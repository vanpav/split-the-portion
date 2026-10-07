import { useState } from 'react'
import { useLocation, useOutletContext, useResolvedPath } from 'react-router'
import { useBack } from '@/app/useBack'
import { DishSearch } from '@/components/DishSearch/DishSearch'
import { DishSearchGroup } from '@/components/DishSearch/DishSearchGroup'
import { DishSearchRow } from '@/components/DishSearch/DishSearchRow'
import { ScreenHeader } from '@/components/ScreenHeader'
import { dishCategory, dishPicks, dishRow, localDay, missingPresets } from '@/domain'
import { useAppStore } from '@/store/store'
import type { DishSourceIngredient, EditorOutlet } from './editorOutlet'

/**
 * «Из блюда» (`…/from-dish` under the dish editor, docs/UX.md §3а): a whole simple dish, own or popular,
 * becomes an ingredient (name + usual weight, docs/SPEC.md §3). The same list as the dish menu, a pick
 * mode; a tap or Enter adds it to the form and goes back, as «←» and the system «назад» do without one.
 */
export function FromSimpleDishScreen() {
  const { onPick } = useOutletContext<EditorOutlet>()
  const { search } = useLocation()
  const { pathname: formPath } = useResolvedPath('..')
  const { back } = useBack(formPath + search)
  const dishes = useAppStore((s) => s.dishes)
  const [query, setQuery] = useState('')
  const [today] = useState(() => localDay(new Date()))
  const { own, popular } = dishPicks(dishes, missingPresets(dishes), { query, today })

  const pick = (source: DishSourceIngredient) => {
    onPick(source)
    back()
  }
  const values = [...own.map((p) => p.dish.id), ...popular.map((p) => `preset:${p.preset.name}`)]

  return (
    <>
      <ScreenHeader title="Из блюда" back backTo={formPath + search} backLabel="Блюдо" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <DishSearch
          query={query}
          onQueryChange={setQuery}
          onClose={back}
          placeholder="Гречка, рис…"
          hint="Блюда из одного продукта — добавятся с обычным весом"
          values={values}
        >
          {values.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Ничего не нашлось</p>}
          {own.length > 0 && (
            <DishSearchGroup heading="Ваши блюда">
              {own.map(({ dish, source }) => (
                <DishSearchRow
                  key={dish.id}
                  value={dish.id}
                  row={dishRow(dish, query, { pick: true })}
                  category={dishCategory(dish)}
                  query={query}
                  mark="add"
                  onSelect={() => pick(source)}
                />
              ))}
            </DishSearchGroup>
          )}
          {popular.length > 0 && (
            <DishSearchGroup heading="Популярные">
              {popular.map(({ preset, source }) => (
                <DishSearchRow
                  key={preset.name}
                  value={`preset:${preset.name}`}
                  row={dishRow(preset, query, { pick: true })}
                  category={dishCategory(preset)}
                  query={query}
                  mark="add"
                  onSelect={() => pick(source)}
                />
              ))}
            </DishSearchGroup>
          )}
        </DishSearch>
      </main>
    </>
  )
}
