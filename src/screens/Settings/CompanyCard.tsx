import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { CompanyForm } from '@/components/CompanyForm'
import { Button } from '@/components/ui/button'
import { lineupName, type Company, type CompanyMember } from '@/domain'
import { useAppStore } from '@/store/store'
import { SettingsRow } from './SettingsRow'

interface CompanyCardProps {
  company: Company
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * A company as one line — «Ваня и Ксюша», «Ваня 54 % · Ксюша 46 %» under it; open — edited in place
 * with the same form as «Добавить компанию» in the calculator (docs/UX.md §3).
 */
export function CompanyCard({ company, open, onOpenChange }: CompanyCardProps) {
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  const deleteCompany = useAppStore((s) => s.deleteCompany)
  const personName = (m: CompanyMember, index: number) => m.name.trim() || `Человек ${index + 1}`

  const remove = () => {
    deleteCompany(company.id)
    toast('Компания удалена', {
      description: company.name.trim() || lineupName(company.members),
      duration: 5000,
      action: { label: 'Отменить', onClick: () => upsertCompany(company) },
    })
  }

  return (
    <SettingsRow
      open={open}
      onOpenChange={onOpenChange}
      title={company.name.trim() || lineupName(company.members) || 'Без названия'}
      detail={company.members.map((m, i) => personName(m, i)).join(', ') || 'Никого'}
    >
      {/* A new company is empty: the first name is typed right away. */}
      <CompanyForm value={company} onChange={(next) => upsertCompany({ ...company, ...next })} autoFocus />
      <div className="flex justify-end">
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}>
          <Trash2Icon data-icon="inline-start" />
          Удалить
        </Button>
      </div>
    </SettingsRow>
  )
}
