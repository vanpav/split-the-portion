import { CheckIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { TareForm } from '@/components/TareForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
import { formatGrams, type Id, type Tare } from '@/domain'
import { cn } from '@/lib/utils'

interface NewTareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The tare to select: the first one added, or one tapped in «Добавлено». */
  onSelect: (tare: Tare) => void
}

/**
 * «Добавить тару» from a tare select: the settings' form in a dialog. Several tares in one go —
 * each added one is listed in «Добавлено»; the first is selected, a tap selects another. «Готово» closes.
 */
export function NewTareDialog({ open, onOpenChange, onSelect }: NewTareDialogProps) {
  const addedId = useId()
  const [added, setAdded] = useState<Tare[]>([])
  const [selectedId, setSelectedId] = useState<Id | null>(null)

  const change = (next: boolean) => {
    if (!next) {
      setAdded([])
      setSelectedId(null)
    }
    onOpenChange(next)
  }
  const select = (tare: Tare) => {
    setSelectedId(tare.id)
    onSelect(tare)
  }
  const created = (tare: Tare) => {
    setAdded((list) => [...list, tare])
    if (selectedId === null) select(tare)
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая тара</DialogTitle>
          <DialogDescription>Вес пустой посуды — вычтем его сами.</DialogDescription>
        </DialogHeader>
        {added.length > 0 && (
          <section className="flex flex-col gap-1">
            <h3 id={addedId} className="text-sm font-medium text-muted-foreground">
              Добавлено
            </h3>
            <ItemGroup role="group" aria-labelledby={addedId} className="gap-0">
              {added.map((tare) => {
                const selected = tare.id === selectedId
                return (
                  <Item key={tare.id} asChild size="sm" className="min-h-11 py-1 text-left hover:bg-muted">
                    <button type="button" aria-pressed={selected} onClick={() => select(tare)}>
                      <CheckIcon aria-hidden className={cn('size-4', selected ? 'text-primary' : 'invisible')} />
                      <ItemContent>
                        <ItemTitle>{tare.name}</ItemTitle>
                      </ItemContent>
                      <ItemActions className="text-muted-foreground tabular-nums">
                        {formatGrams(tare.grams)} г
                      </ItemActions>
                    </button>
                  </Item>
                )
              })}
            </ItemGroup>
          </section>
        )}
        <TareForm autoFocus onCreated={created} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Готово</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
