import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { dishPath } from '@/app/paths'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { dishSummary, dishTitle, missingPresets, presetDish, recentDishes, type PresetDish } from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'

interface DishSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** When a popular dish is added: its createdAt and updatedAt (it becomes the latest used). */
const nowIso = () => new Date().toISOString()

/** Lower case, «е» for «ё»: nobody types «свёкла» at the stove. */
const plain = (text: string) => text.toLowerCase().replace(/ё/g, 'е')

/**
 * cmdk's filter: by the names in `keywords` — the title first, then the products (the value holds an id) —
 * as text, not fuzzy: «бул» is булгур, not «Борщ». The title before the products, a word that starts with
 * the query before one that only contains it: «рис» puts «Рис» above «Суп» with rice in it.
 */
function byName(_value: string, search: string, keywords: string[] = []): number {
  const query = plain(search).trim()
  if (!query) return 1
  const [title = '', ...products] = keywords.map(plain)
  const startsWord = (name: string) => name.startsWith(query) || name.includes(` ${query}`)
  if (title === query) return 1
  if (startsWord(title)) return 0.9
  if (title.includes(query)) return 0.7
  if (products.some(startsWord)) return 0.5
  return products.some((name) => name.includes(query)) ? 0.3 : 0
}

/**
 * Search from the dish shelf: the user's dishes first — a tap opens one; then the popular dishes they
 * do not have yet, with their usual weight — a tap adds the dish and opens it at once.
 */
export function DishSearch({ open, onOpenChange }: DishSearchProps) {
  const navigate = useNavigate()
  const dishes = useAppStore((s) => s.dishes)
  const addDishes = useAppStore((s) => s.addDishes)
  const deleteDish = useAppStore((s) => s.deleteDish)
  const popular = missingPresets(dishes)

  const go = (id: string) => {
    onOpenChange(false)
    navigate(dishPath(id))
  }
  const add = (preset: PresetDish) => {
    const dish = presetDish(preset, newId, nowIso())
    addDishes([dish])
    go(dish.id)
    toast('Блюдо добавлено', {
      description: `${preset.name} · ${dishSummary(dish.ingredients)}`,
      action: { label: 'Отменить', onClick: () => deleteDish(dish.id) },
    })
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Поиск блюда"
      description="Свои блюда и популярные с их обычным весом"
      // At the top on a phone: the system keyboard takes the bottom half.
      className="top-4 sm:top-1/4"
    >
      <Command filter={byName}>
        {/* 16 px and more: a smaller field makes the iPhone zoom in on focus. */}
        <CommandInput placeholder="Гречка, суп…" className="text-base" />
        <CommandList className="max-h-[min(24rem,50svh)]">
          <CommandEmpty>Ничего не нашлось</CommandEmpty>
          {dishes.length > 0 && (
            <CommandGroup heading="Ваши блюда">
              {recentDishes(dishes).map((dish) => {
                const title = dishTitle(dish)
                return (
                  <CommandItem
                    key={dish.id}
                    // Unique even for two dishes with one title; matched by `keywords` only.
                    value={dish.id}
                    keywords={[title, ...dish.ingredients.map((i) => i.name)]}
                    onSelect={() => go(dish.id)}
                    className="min-h-11 text-base"
                  >
                    <span className="max-w-[65%] shrink-0 truncate">{title}</span>
                    <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground tabular-nums">
                      {dishSummary(dish.ingredients)}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {popular.length > 0 && (
            <CommandGroup heading="Популярные — добавить">
              {popular.map((preset) => (
                <CommandItem
                  key={preset.name}
                  value={`preset:${preset.name}`}
                  keywords={[preset.name, ...preset.ingredients.map((i) => i.name)]}
                  onSelect={() => add(preset)}
                  className="min-h-11 text-base"
                >
                  <span className="max-w-[65%] shrink-0 truncate">{preset.name}</span>
                  <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground tabular-nums">
                    {dishSummary(preset.ingredients)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
