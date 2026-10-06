import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { dishPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { BottomBar } from '@/components/BottomBar'
import { CompanyForm, type CompanyDraft } from '@/components/CompanyForm'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/store'
import type { CalculatorOutlet } from './calculatorOutlet'

/**
 * `#/d/:id/company/new` — «Добавить компанию» from the calculator's company list (docs/UX.md §3а):
 * the settings' form on a screen of its own. Nothing is stored until «Добавить компанию», which picks
 * the company for the dish and goes back; «←» drops the draft.
 */
export function NewCompanyScreen() {
  const { dishId, onCompany } = useOutletContext<CalculatorOutlet>()
  const { back } = useBack(dishPath(dishId))
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  const [draft, setDraft] = useState<CompanyDraft>({ name: '', members: [] })

  const add = () => {
    if (draft.members.length === 0) return
    const id = upsertCompany({ ...draft, name: draft.name.trim() })
    onCompany(useAppStore.getState().companies.find((c) => c.id === id)!)
    back()
  }

  return (
    <>
      <ScreenHeader title="Новая компания" back backTo={dishPath(dishId)} backLabel="Калькулятор" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        <p className="px-1 text-sm text-muted-foreground">Кто ест вместе и в каком соотношении.</p>
        <CompanyForm value={draft} onChange={setDraft} autoFocus />
        <BottomBar>
          <Button size="lg" className="flex-1 lg:flex-none" disabled={draft.members.length === 0} onClick={add}>
            <PlusIcon data-icon="inline-start" />
            Добавить компанию
          </Button>
        </BottomBar>
      </main>
    </>
  )
}
