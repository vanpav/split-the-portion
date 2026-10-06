import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { CompanyForm, type CompanyDraft } from '@/components/CompanyForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Company } from '@/domain'
import { useAppStore } from '@/store/store'

interface NewCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The company just added; the dialog closes by itself. */
  onCreated: (company: Company) => void
}

const EMPTY: CompanyDraft = { name: '', members: [] }

/**
 * «Добавить компанию» from a company select: the settings' form in a dialog. Nothing is stored
 * until «Добавить компанию»; closed without it, the draft is dropped.
 */
export function NewCompanyDialog({ open, onOpenChange, onCreated }: NewCompanyDialogProps) {
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  const [draft, setDraft] = useState<CompanyDraft>(EMPTY)

  const change = (next: boolean) => {
    if (!next) setDraft(EMPTY)
    onOpenChange(next)
  }
  const add = () => {
    if (draft.members.length === 0) return
    const company = { ...draft, name: draft.name.trim() }
    const id = upsertCompany(company)
    onCreated({ ...company, id })
    change(false)
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая компания</DialogTitle>
          <DialogDescription>Кто ест вместе и в каком соотношении.</DialogDescription>
        </DialogHeader>
        <CompanyForm value={draft} onChange={setDraft} autoFocus />
        <DialogFooter>
          <Button disabled={draft.members.length === 0} onClick={add}>
            <PlusIcon data-icon="inline-start" />
            Добавить компанию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
