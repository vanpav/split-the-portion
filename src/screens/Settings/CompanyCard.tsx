import { PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { NumberField } from '@/components/NumberField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { defaultShareWeight, lineupName, toPercents, type Company, type CompanyMember } from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'
import { SettingsRow } from './SettingsRow'

const weightError = (v: number | null) => (v !== null && v <= 0 ? 'Больше 0' : null)

interface CompanyCardProps {
  company: Company
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * A company as one line — «Ваня и Ксюша», «Ваня 54 % · Ксюша 46 %» under it; open — name, people
 * and their shares edited in place (docs/SPEC.md §3а).
 */
export function CompanyCard({ company, open, onOpenChange }: CompanyCardProps) {
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  const deleteCompany = useAppStore((s) => s.deleteCompany)
  const percents = toPercents(company.members.map((m) => m.weight))
  const personName = (m: CompanyMember, index: number) => m.name.trim() || `Человек ${index + 1}`

  const save = (patch: Partial<Company>) => upsertCompany({ ...company, ...patch })
  const setMember = (id: string, patch: Partial<CompanyMember>) =>
    save({ members: company.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  const addMember = () => {
    const weight = defaultShareWeight(company.members.map((m) => m.weight))
    save({ members: [...company.members, { id: newId(), name: '', weight }] })
  }

  const remove = () => {
    deleteCompany(company.id)
    toast('Удалено', {
      description: company.name || 'Компания',
      duration: 5000,
      action: { label: 'Отменить', onClick: () => upsertCompany(company) },
    })
  }

  return (
    <SettingsRow
      open={open}
      onOpenChange={onOpenChange}
      title={company.name.trim() || lineupName(company.members) || 'Без названия'}
      detail={company.members.map((m, i) => `${personName(m, i)} ${percents[i]} %`).join(' · ') || 'Никого'}
    >
      <Input
        aria-label="Название компании"
        placeholder={lineupName(company.members) || 'Ваня и Ксюша'}
        className="font-medium"
        value={company.name}
        onChange={(e) => save({ name: e.target.value })}
      />
      <ul className="flex flex-col gap-2">
        {company.members.map((m, index) => (
          <li key={m.id} className="flex items-start gap-2">
            <Input
              aria-label={`Имя ${index + 1}`}
              placeholder="Имя"
              autoFocus={m.name === '' && index === company.members.length - 1 && index > 0}
              value={m.name}
              onChange={(e) => setMember(m.id, { name: e.target.value })}
            />
            <NumberField
              className="w-20 shrink-0"
              ariaLabel={`Доля, ${personName(m, index)}`}
              suffix=""
              value={m.weight}
              validate={weightError}
              onValueChange={(weight) => weight !== null && setMember(m.id, { weight })}
            />
            {/* What the share means: the part of the dish. */}
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-end text-sm text-muted-foreground tabular-nums">
              {percents[index]} %
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Убрать ${m.name || 'строку'}`}
              onClick={() => save({ members: company.members.filter((x) => x.id !== m.id) })}
            >
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Доля — любое число: 1 и 1 — поровну, 70 и 60 — как сухие граммы.</p>
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={addMember}>
          <PlusIcon data-icon="inline-start" />
          Человек
        </Button>
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}>
          <Trash2Icon data-icon="inline-start" />
          Удалить
        </Button>
      </div>
    </SettingsRow>
  )
}
