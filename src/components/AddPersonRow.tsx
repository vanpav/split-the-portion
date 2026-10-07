import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface AddPersonRowProps {
  className?: string
  onAdd: (name: string) => void
  /** Focus the field on mount: a new company starts with typing its first name. */
  autoFocus?: boolean
  /** For focusing the field from outside: the empty «Добавьте людей» bar, the way back from «Новая компания». */
  id?: string
}

/**
 * The last line of a people list («Кто ест», a company in the settings): type a name, Enter —
 * the person is in (with an average share), and the field is ready for the next one.
 * No nameless rows to fix afterwards.
 */
export function AddPersonRow({ onAdd, autoFocus, id, className }: AddPersonRowProps) {
  const [name, setName] = useState('')

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    // A field like every other with an icon (the dish menu's search): the whole width, «+» inside it.
    <li className={cn('py-2', className)}>
      <InputGroup>
        <InputGroupAddon>
          <PlusIcon />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          aria-label="Добавить человека"
          placeholder="Имя"
          value={name}
          autoFocus={autoFocus}
          enterKeyHint="done"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          // A name typed and left is still added: tapping elsewhere must not lose it.
          onBlur={add}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          // 16 px and more, on every width: a smaller field makes the iPhone zoom in on focus.
          className="text-base md:text-base"
        />
      </InputGroup>
    </li>
  )
}
