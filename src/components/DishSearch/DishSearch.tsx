import { ListTreeIcon, SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Command, CommandList } from '@/components/ui/command'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { KEYBOARD_PROXY_ID } from '@/lib/domIds'
import { cn } from '@/lib/utils'

interface DishSearchProps {
  query: string
  onQueryChange: (query: string) => void
  /** Esc in an empty field. */
  onClose: () => void
  placeholder: string
  /** The `value`s of the rows, in the order shown: Enter takes the selected one, the first by default. */
  values: string[]
  /** «По категориям» in the field (the dish menu only): on / off and the switch. Absent — no button. */
  grouping?: { on: boolean; onToggle: () => void }
  /** A quiet line under the field. */
  hint?: ReactNode
  /** Between the field and the list. */
  before?: ReactNode
  /** The list: `CommandGroup`s with `DishSearchRow`s. */
  children: ReactNode
  /** After the list. */
  after?: ReactNode
}

/**
 * The search of every dish list (`#/dishes`, «Из блюда»): the field and the list, cmdk without its own
 * filter — the list is the domain's (`dishMenu`, `dishPicks`), cmdk gives ↑ / ↓ and Enter.
 */
export function DishSearch({
  query,
  onQueryChange,
  onClose,
  placeholder,
  values,
  grouping,
  hint,
  before,
  children,
  after,
}: DishSearchProps) {
  // The row Enter takes: the one picked with ↑ / ↓ or the pointer while it is still listed, else the first.
  const [picked, setPicked] = useState<string>()
  const selected = picked !== undefined && values.includes(picked) ? picked : (values[0] ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const change = (next: string) => {
    onQueryChange(next)
    setPicked(undefined)
  }

  // Letters typed right after 🔍, before the screen showed up, went to the invisible field (KEYBOARD_PROXY_ID):
  // they move over here, so the first letters are not lost. Checked after every render, a no-op
  // once the invisible field is empty; its letters come before anything already in this field.
  useEffect(() => {
    const proxy = document.getElementById(KEYBOARD_PROXY_ID)
    if (!(proxy instanceof HTMLInputElement) || !proxy.value) return
    const typed = proxy.value
    proxy.value = ''
    change(typed + (inputRef.current?.value ?? ''))
  })

  const clear = () => {
    change('')
    // In the tap itself: the field keeps the focus and the phone its keyboard.
    inputRef.current?.focus()
  }

  return (
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
          // The field is what the screen is for: typed into at once. On an iPhone the keyboard is already
          // open — 🔍 focused the invisible field in its tap (KEYBOARD_PROXY_ID), this one takes it over.
          autoFocus
          value={query}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            e.preventDefault()
            if (query) change('')
            else onClose()
          }}
          placeholder={placeholder}
          aria-label="Найти блюдо"
          type="text"
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          // 16 px and more, on every width: a smaller field makes the iPhone zoom in on focus.
          className="text-base md:text-base"
        />
        {(query || grouping) && (
          <InputGroupAddon align="inline-end">
            {query && (
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
            )}
            {grouping && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    size="icon-sm"
                    aria-label="По категориям"
                    aria-pressed={grouping.on}
                    // The same as ✕: a tap keeps the focus in the field and the keyboard open.
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={grouping.onToggle}
                    className={cn(
                      'size-10 rounded-full',
                      grouping.on
                        ? 'bg-secondary text-foreground ring-2 ring-foreground ring-inset hover:bg-secondary'
                        : 'bg-transparent text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <ListTreeIcon />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                  По категориям
                </TooltipContent>
              </Tooltip>
            )}
          </InputGroupAddon>
        )}
      </InputGroup>
      {hint && <p className="-mt-1 px-1 text-sm text-muted-foreground">{hint}</p>}
      {before}
      {/* The page scrolls, not the list: as long as the dishes are. */}
      <CommandList className="max-h-none overflow-visible">{children}</CommandList>
      {after}
    </Command>
  )
}
