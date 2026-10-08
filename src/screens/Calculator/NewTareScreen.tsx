import { CheckIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { useLocation, useOutletContext, useResolvedPath } from 'react-router'
import { useBack } from '@/app/useBack'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { TareForm } from '@/components/TareForm'
import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
import { type Id, type Tare } from '@/domain'
import { cn } from '@/lib/utils'
import type { TareOutlet } from './calculatorOutlet'
import { t } from '@/i18n'
import { gramsText } from '@/i18n/format'

/**
 * `…/tare/new` — «Добавить тару» from the calculator's tare list (`#/d/:id/tare/new`, docs/UX.md П4, §3а)
 * or «+» in the dish editor's tare chips (`#/d/:id/edit/tare/new`, `#/d/new/tare/new`): the settings' form
 * on a screen of its own. Several tares in one go — each added one is listed in «Добавлено»; the first is
 * selected for the dish at once, a tap selects another. «Готово» and «←» go back to the screen under it,
 * what was added stays.
 */
export function NewTareScreen() {
  const { onTare, backLabel } = useOutletContext<TareOutlet>()
  // The screen under this one, with its query: the dish editor's `?from=` is part of its address.
  const { search } = useLocation()
  const backTo = useResolvedPath('..').pathname + search
  const { back } = useBack(backTo)
  const addedId = useId()
  const [added, setAdded] = useState<Tare[]>([])
  const [selectedId, setSelectedId] = useState<Id | null>(null)

  const select = (tare: Tare) => {
    setSelectedId(tare.id)
    onTare(tare)
  }
  const created = (tare: Tare) => {
    setAdded((list) => [...list, tare])
    if (selectedId === null) select(tare)
  }

  return (
    <>
      <ScreenHeader title={t('calculator.newTare.title')} back backTo={backTo} backLabel={backLabel} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        <p className="px-1 text-sm text-muted-foreground">{t('calculator.newTare.lead')}</p>
        {added.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 id={addedId} className="px-1 text-sm font-medium text-muted-foreground">
              {t('calculator.newTare.added')}
            </h2>
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
                      <ItemActions className="text-muted-foreground tabular-nums">{gramsText(tare.grams)}</ItemActions>
                    </button>
                  </Item>
                )
              })}
            </ItemGroup>
          </section>
        )}
        <TareForm autoFocus onCreated={created} />
        <BottomBar>
          <Button size="lg" variant="outline" className="flex-1 lg:flex-none" onClick={back}>
            {t('common.done')}
          </Button>
        </BottomBar>
      </main>
    </>
  )
}
