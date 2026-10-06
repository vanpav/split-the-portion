import { CookingPotIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dishSource, formatGrams, type Id } from '@/domain'
import { useAppStore } from '@/store/store'

type Source = NonNullable<ReturnType<typeof dishSource>>

/** «Из простого блюда»: a whole simple dish becomes an ingredient (name + usual weight, docs/SPEC.md §3). */
export function FromSimpleDishPicker({ onPick }: { onPick: (source: Source) => void }) {
  const dishes = useAppStore((s) => s.dishes)
  const [open, setOpen] = useState(false)

  const sources = useMemo(
    () =>
      dishes.flatMap((d): { id: Id; source: Source }[] => {
        const source = dishSource(d)
        return source ? [{ id: d.id, source }] : []
      }),
    [dishes],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CookingPotIcon data-icon="inline-start" />
          Из простого блюда
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Найти блюдо" />
          <CommandList>
            <CommandEmpty>{sources.length === 0 ? 'Простых блюд пока нет' : 'Ничего не нашлось'}</CommandEmpty>
            <CommandGroup>
              {sources.map(({ id, source }) => (
                <CommandItem
                  key={id}
                  value={`${source.name} ${id}`}
                  onSelect={() => {
                    onPick(source)
                    setOpen(false)
                  }}
                >
                  {source.name}
                  {source.rawGrams !== null && ` · ${formatGrams(source.rawGrams)} г`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
