import { ArrowDownIcon, CheckIcon, DeleteIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { KeypadKey } from '@/domain'
import { cn } from '@/lib/utils'

interface KeypadProps {
  onKey: (key: KeypadKey) => void
  /** Moves to the next field. */
  onNext: () => void
  onSave: () => void
  saveDisabled: boolean
}

const KEY = 'h-14 text-2xl font-medium tabular-nums active:scale-[0.97] transition-transform'

/**
 * Calculator keypad, the way unit converters do it: big keys within the thumb's reach,
 * no system keyboard covering the result.
 */
export function Keypad({ onKey, onNext, onSave, saveDisabled }: KeypadProps) {
  const digit = (key: KeypadKey, label: ReactNode = key) => (
    <Button key={key} type="button" variant="secondary" className={KEY} onClick={() => onKey(key)}>
      {label}
    </Button>
  )

  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Клавиатура">
      {digit('7')}
      {digit('8')}
      {digit('9')}
      <Button type="button" variant="outline" className={KEY} aria-label="Стереть" onClick={() => onKey('back')}>
        <DeleteIcon className="size-6" />
      </Button>
      {digit('4')}
      {digit('5')}
      {digit('6')}
      <Button type="button" variant="outline" className={cn(KEY, 'text-lg')} aria-label="Очистить" onClick={() => onKey('clear')}>
        C
      </Button>
      {digit('1')}
      {digit('2')}
      {digit('3')}
      <Button type="button" variant="outline" className={KEY} aria-label="Следующее поле" onClick={onNext}>
        <ArrowDownIcon className="size-6" />
      </Button>
      {digit(',', ',')}
      {digit('0')}
      <Button type="button" className={cn(KEY, 'col-span-2 text-lg')} disabled={saveDisabled} onClick={onSave}>
        <CheckIcon data-icon="inline-start" />
        Сохранить
      </Button>
    </div>
  )
}
