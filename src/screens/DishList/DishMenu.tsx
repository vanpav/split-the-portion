import { SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { dishPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { Command, CommandEmpty, CommandGroup, CommandList } from '@/components/ui/command'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { KEYBOARD_PROXY_ID } from '@/lib/domIds'
import {
  dishMenu,
  dishSummary,
  dishTitle,
  localDay,
  missingPresets,
  parseDishSort,
  parseKindFilter,
  presetDish,
  type DishSort,
  type KindFilter,
  type PresetDish,
} from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'
import { DishMenuRow } from './DishMenuRow'

const KINDS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'simple', label: 'Простые' },
  { value: 'composite', label: 'Составные' },
]

const SORTS: { value: DishSort; label: string }[] = [
  { value: 'frequent', label: 'Частые' },
  { value: 'name', label: 'По названию' },
]

const presetValue = (preset: PresetDish) => `preset:${preset.name}`

/** When a popular dish is added: its createdAt and updatedAt (it goes first on the shelf). */
const nowIso = () => new Date().toISOString()

/** The search, the filters and the list: the part of the menu that needs dishes to show. */
export function DishMenu() {
  const navigate = useNavigate()
  const dishes = useAppStore((s) => s.dishes)
  const addDishes = useAppStore((s) => s.addDishes)
  const deleteDish = useAppStore((s) => s.deleteDish)
  const { back, hasPrevious, noPreviousState } = useBack('/')
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const kind = parseKindFilter(params.get('kind'))
  const sort = parseDishSort(params.get('sort'))
  // Today for «Частые», fixed while the menu is open.
  const [today] = useState(() => localDay(new Date()))
  const { own, popular } = dishMenu(dishes, missingPresets(dishes), { query, kind, sort, today })

  // The row Enter opens: the one picked with ↑ / ↓ or the pointer while it is still listed, else the first.
  const [picked, setPicked] = useState<string>()
  const values = [...own.map((d) => d.id), ...popular.map(presetValue)]
  const selected = picked !== undefined && values.includes(picked) ? picked : (values[0] ?? '')

  const inputRef = useRef<HTMLInputElement>(null)

  // Typing and switching replace the entry: «назад» leaves the menu, not each letter. Defaults stay out
  // of the address. Opened by a direct link, the menu still has no previous screen of the app (useBack).
  const update = (next: { q?: string; kind?: KindFilter; sort?: DishSort }) => {
    const merged = { q: query, kind, sort, ...next }
    const search = new URLSearchParams()
    if (merged.q) search.set('q', merged.q)
    if (merged.kind !== 'all') search.set('kind', merged.kind)
    if (merged.sort !== 'frequent') search.set('sort', merged.sort)
    setParams(search, { replace: true, preventScrollReset: true, state: hasPrevious ? undefined : noPreviousState })
    setPicked(undefined)
  }

  // Letters typed right after 🔍, before the menu showed up, went to the invisible field (KEYBOARD_PROXY_ID):
  // they move over here, so the first letters are not lost. Checked after every render, a no-op
  // once the invisible field is empty; its letters come before anything already in this field.
  useEffect(() => {
    const proxy = document.getElementById(KEYBOARD_PROXY_ID)
    if (!(proxy instanceof HTMLInputElement) || !proxy.value) return
    const typed = proxy.value
    proxy.value = ''
    update({ q: typed + (inputRef.current?.value ?? '') })
  })

  const clear = () => {
    update({ q: '' })
    // In the tap itself: the field keeps the focus and the phone its keyboard.
    inputRef.current?.focus()
  }

  const add = (preset: PresetDish) => {
    const dish = presetDish(preset, newId, nowIso())
    addDishes([dish])
    navigate(dishPath(dish.id))
    toast('Блюдо добавлено', {
      description: `${preset.name} · ${dishSummary(dish.ingredients)}`,
      action: { label: 'Отменить', onClick: () => deleteDish(dish.id) },
    })
  }

  return (
    // cmdk without its own filter: the list is the domain's (`dishMenu`), cmdk gives ↑ / ↓ and Enter.
    <Command
      shouldFilter={false}
      value={selected}
      onValueChange={setPicked}
      loop
      label="Блюда"
      className="size-auto gap-3 overflow-visible rounded-none! bg-transparent p-0"
    >
      <InputGroup className="h-12">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          // The field is what the menu is for: typed into at once. On an iPhone the keyboard is already
          // open — 🔍 focused the invisible field in its tap (KEYBOARD_PROXY_ID), this one takes it over.
          autoFocus
          value={query}
          onChange={(e) => update({ q: e.target.value })}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            e.preventDefault()
            if (query) update({ q: '' })
            else back()
          }}
          placeholder="Гречка, суп…"
          aria-label="Найти блюдо"
          type="text"
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          // 16 px and more, on every width: a smaller field makes the iPhone zoom in on focus.
          className="text-base md:text-base"
        />
        {query && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              className="size-10 rounded-full"
              aria-label="Очистить"
              // Not on pointer down: the field would lose the focus and the phone its keyboard.
              onPointerDown={(e) => e.preventDefault()}
              onClick={clear}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {/* Their own arrows and Esc: not the list's. */}
      <div className="flex flex-wrap items-center justify-between gap-2" onKeyDown={(e) => e.stopPropagation()}>
        <ToggleGroup
          type="single"
          variant="outline"
          aria-label="Тип блюда"
          value={kind}
          onValueChange={(v) => v && update({ kind: parseKindFilter(v) })}
        >
          {KINDS.map((k) => (
            <ToggleGroupItem key={k.value} value={k.value} className="min-h-11 px-3">
              {k.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Select value={sort} onValueChange={(v) => update({ sort: parseDishSort(v) })}>
          <SelectTrigger aria-label="Сортировка" className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="min-h-11">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* The page scrolls, not the list: as long as the dishes are. */}
      <CommandList className="max-h-none overflow-visible">
        <CommandEmpty>Ничего не нашлось</CommandEmpty>
        {own.length > 0 && (
          <CommandGroup heading="Ваши блюда" className="px-0">
            {own.map((dish) => (
              <DishMenuRow
                key={dish.id}
                value={dish.id}
                title={dishTitle(dish)}
                summary={dishSummary(dish.ingredients)}
                onSelect={() => navigate(dishPath(dish.id))}
              />
            ))}
          </CommandGroup>
        )}
        {popular.length > 0 && (
          <CommandGroup heading="Популярные — добавить" className="px-0">
            {popular.map((preset) => (
              <DishMenuRow
                key={preset.name}
                value={presetValue(preset)}
                title={preset.name}
                summary={dishSummary(preset.ingredients)}
                onSelect={() => add(preset)}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}
