import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NumberField } from '@/components/NumberField'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatGrams, isValidTareGrams, type TareSnapshot } from '@/domain'
import { useAppStore } from '@/store/store'

interface TarePickerProps {
  value: TareSnapshot | null
  onSelect: (tare: TareSnapshot) => void
}

const tareLabel = (t: { name: string; grams: number }) => `${t.name} · ${formatGrams(t.grams)} г`

/** Combobox over the tare library; a new tare can be created right here and is selected at once. */
export function TarePicker({ value, onSelect }: TarePickerProps) {
  const tares = useAppStore((s) => s.tares)
  const upsertTare = useAppStore((s) => s.upsertTare)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [grams, setGrams] = useState<number | null>(null)

  const choose = (tare: TareSnapshot) => {
    onSelect(tare)
    setOpen(false)
  }

  const create = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !isValidTareGrams(grams)) return
    const tare = { name: name.trim(), grams }
    choose({ ...tare, id: upsertTare(tare) })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setCreating(tares.length === 0)
          setName('')
          setGrams(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label={value ? `Тара: ${tareLabel(value)}` : 'Тара'}
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={value ? 'truncate' : 'truncate text-muted-foreground'}>
            {value ? tareLabel(value) : 'Выберите тару'}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        {creating ? (
          <form className="flex flex-col gap-2 p-3" onSubmit={create}>
            <p className="text-sm font-medium">Новая тара</p>
            <Input
              aria-label="Название тары"
              placeholder="Кастрюля 3 л"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <NumberField ariaLabel="Вес тары" placeholder="850" value={grams} onValueChange={setGrams} />
            <div className="flex gap-2">
              <Button type="submit" disabled={!name.trim() || !isValidTareGrams(grams)}>
                Сохранить
              </Button>
              {tares.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                  К списку
                </Button>
              )}
            </div>
          </form>
        ) : (
          <Command>
            <CommandInput placeholder="Найти тару" />
            <CommandList>
              <CommandEmpty>Ничего не нашлось</CommandEmpty>
              <CommandGroup>
                {tares.map((tare) => (
                  <CommandItem key={tare.id} value={`${tare.name} ${tare.id}`} onSelect={() => choose(tare)}>
                    {tareLabel(tare)}
                    <CheckIcon className={value?.id === tare.id ? 'ml-auto' : 'ml-auto opacity-0'} />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem value="+ новая тара" onSelect={() => setCreating(true)}>
                  <PlusIcon />
                  Новая тара
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
