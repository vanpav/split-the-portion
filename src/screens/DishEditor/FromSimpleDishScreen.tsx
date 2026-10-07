import { useMemo } from 'react'
import { useLocation, useOutletContext, useResolvedPath } from 'react-router'
import { useBack } from '@/app/useBack'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { dishSource, formatGrams, type Id } from '@/domain'
import { useAppStore } from '@/store/store'
import type { DishSourceIngredient, EditorOutlet } from './editorOutlet'

/**
 * «Из простого блюда» (`…/from-dish` under the dish editor, docs/UX.md §3а): a whole simple dish
 * becomes an ingredient (name + usual weight, docs/SPEC.md §3). A search over the list, the full
 * screen; a tap adds it to the form and goes back, as «←» and the system «назад» do without one.
 */
export function FromSimpleDishScreen() {
  const { onPick } = useOutletContext<EditorOutlet>()
  const { search } = useLocation()
  const { pathname: formPath } = useResolvedPath('..')
  const { back } = useBack(formPath + search)
  const dishes = useAppStore((s) => s.dishes)

  const sources = useMemo(
    () =>
      dishes.flatMap((d): { id: Id; source: DishSourceIngredient }[] => {
        const source = dishSource(d)
        return source ? [{ id: d.id, source }] : []
      }),
    [dishes],
  )

  return (
    <>
      <ScreenHeader title="Из простого блюда" back backTo={formPath + search} backLabel="Блюдо" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4">
        <Command className="bg-transparent">
          <CommandInput autoFocus placeholder="Найти блюдо" className="text-base" />
          <CommandList className="max-h-none">
            <CommandEmpty>{sources.length === 0 ? 'Простых блюд пока нет. Сначала добавь простое блюдо.' : 'Ничего не нашлось'}</CommandEmpty>
            <CommandGroup>
              {sources.map(({ id, source }) => (
                <CommandItem
                  key={id}
                  value={`${source.name} ${id}`}
                  className="min-h-11"
                  onSelect={() => {
                    onPick(source)
                    back()
                  }}
                >
                  {source.name}
                  {source.rawGrams !== null && (
                    <span className="ml-auto text-muted-foreground tabular-nums">{formatGrams(source.rawGrams)} г</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </main>
    </>
  )
}
