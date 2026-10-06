import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface AddPersonRowProps {
  onAdd: (name: string) => void
  /** The field gained or lost focus: the system keyboard is up while it is focused. */
  onEditingName?: (editing: boolean) => void
  /** Focus the field on mount: a new company starts with typing its first name. */
  autoFocus?: boolean
}

/**
 * The last line of a people list («Кто ест», a company in the settings): type a name, Enter —
 * the person is in (with an average share), and the field is ready for the next one.
 * No nameless rows to fix afterwards.
 */
export function AddPersonRow({ onAdd, onEditingName, autoFocus }: AddPersonRowProps) {
  const [name, setName] = useState('')

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <li className="flex items-center gap-1 py-2">
      <PlusIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <Input
        aria-label="Добавить человека"
        placeholder="Имя"
        value={name}
        autoFocus={autoFocus}
        enterKeyHint="done"
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
        onFocus={() => onEditingName?.(true)}
        // A name typed and left is still added: tapping elsewhere must not lose it.
        onBlur={() => {
          add()
          onEditingName?.(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
        className="h-11 border-transparent bg-transparent px-1 text-base shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
      />
    </li>
  )
}
