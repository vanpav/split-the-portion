import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { dishPath, settingsPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { dishCountText, missingPresets, pickedDishes, popularView, presetWeight, PRESET_DISHES, type PopularFilter, type PresetDish } from '@/domain'
import { cn } from '@/lib/utils'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'
import { PopularFilters } from './PopularFilters'
import { PopularSection } from './PopularSection'

const fieldId = (preset: PresetDish) => `popular-weight-${preset.name}`

/**
 * `#/popular` (docs/UX.md §3г): the whole catalogue of popular dishes — tick what you cook, set the weight
 * in the row, «Добавить» puts them all on the shelf at once; «Пропустить» leaves with nothing. What is
 * ticked and typed lives while the screen is open and is not saved. `?group=1`: just after «Создать группу».
 */
export function PopularScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const afterGroup = params.get('group') === '1'
  const { back } = useBack(afterGroup ? settingsPath('group') : '/')
  const dishes = useAppStore((s) => s.dishes)
  const addDishes = useAppStore((s) => s.addDishes)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PopularFilter>('all')
  // Names in the order ticked: the first ticked goes first on the shelf.
  const [order, setOrder] = useState<string[]>([])
  const [typed, setTyped] = useState<Record<string, number | null>>({})
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)

  const picked = useMemo(() => new Set(order), [order])
  const taken = useMemo(() => {
    const free = new Set(missingPresets(dishes).map((p) => p.name))
    return new Set(PRESET_DISHES.filter((p) => !free.has(p.name)).map((p) => p.name))
  }, [dishes])
  const view = popularView(query, filter, picked)
  const grams = (preset: PresetDish) => (preset.name in typed ? typed[preset.name] : presetWeight(preset))

  const pick = (names: string[]) => setOrder((o) => [...o, ...names.filter((n) => !o.includes(n))])
  const unpick = (names: string[]) => setOrder((o) => o.filter((n) => !names.includes(n)))
  const setInvalidFor = (name: string, bad: boolean) =>
    setInvalid((prev) => {
      if (prev.has(name) === bad) return prev
      const next = new Set(prev)
      if (bad) next.add(name)
      else next.delete(name)
      return next
    })

  // Enter: the weight of the next ticked dish in the list; after the last one the keyboard closes.
  const focusNext = (preset: PresetDish) => {
    const fields = Array.from(listRef.current?.querySelectorAll<HTMLInputElement>('li[data-picked] input') ?? [])
    const next = fields[fields.findIndex((f) => f.id === fieldId(preset)) + 1]
    if (next) next.focus()
    else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  const add = () => {
    // A weight that is not a number stops it: the cursor goes to the first such field.
    if (order.some((name) => invalid.has(name))) {
      listRef.current?.querySelector<HTMLInputElement>('li[data-picked] input[aria-invalid="true"]')?.focus()
      return
    }
    const chosen = order.flatMap((name) => {
      const preset = PRESET_DISHES.find((p) => p.name === name)
      return preset ? [{ preset, grams: grams(preset) }] : []
    })
    const added = pickedDishes(dishes, chosen, newId, new Date().toISOString())
    if (added.length === 0) return
    addDishes(added)
    // The calculator of the first one; this screen leaves the history, «назад» does not bring it back.
    navigate(dishPath(added[0].id), { replace: true })
  }

  const any = order.length > 0
  const nothing = view.sections.every((s) => s.presets.length === 0)
  return (
    <>
      <ScreenHeader
        title="Популярные блюда"
        back
        compactTitle
        backTo={afterGroup ? settingsPath('group') : '/'}
        backLabel={afterGroup ? 'Группа' : 'Блюда'}
        action={
          <Button
            variant="ghost"
            className={cn('-mr-1 px-2 text-base', any ? 'font-semibold text-primary hover:bg-primary/12 hover:text-primary' : 'font-medium text-muted-foreground')}
            aria-label={any ? `Добавить ${dishCountText(order.length)}` : undefined}
            onClick={any ? add : back}
          >
            {any ? 'Добавить' : 'Пропустить'}
          </Button>
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-sm text-muted-foreground">
          {afterGroup
            ? 'В новой группе блюд пока нет. Отметь, что готовишь: блюда будут общими.'
            : 'Отметь, что готовишь. Справа обычный вес на раз — его можно поправить.'}
        </p>
        <PopularFilters
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          counts={view.counts}
          anyPicked={any}
        />
        <div ref={listRef}>
          {nothing ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {filter === 'picked' && query.trim() === '' ? 'Пока ничего не отмечено' : 'Ничего не нашлось'}
            </p>
          ) : (
            view.sections.map((section) => (
              <PopularSection
                key={section.category ?? 'list'}
                category={section.category}
                presets={section.presets}
                query={query}
                picked={picked}
                taken={taken}
                grams={grams}
                fieldId={fieldId}
                onToggleAll={(presets, on) => (on ? pick(presets.map((p) => p.name)) : unpick(presets.map((p) => p.name)))}
                onPick={(p) => pick([p.name])}
                onUnpick={(p) => unpick([p.name])}
                onGrams={(p, g) => setTyped((t) => ({ ...t, [p.name]: g }))}
                onInvalid={(p, bad) => setInvalidFor(p.name, bad)}
                onEnter={focusNext}
              />
            ))
          )}
        </div>
      </main>
    </>
  )
}
