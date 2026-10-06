import { Trash2Icon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AddPersonRow } from '@/components/AddPersonRow'
import { HoldButton } from '@/components/HoldButton'
import { ShareSlider, type DishSegment } from '@/components/ShareSlider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { defaultShareWeight, lineupName, percentShares, toPercents, type Company, type CompanyMember } from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'
import { SettingsRow } from './SettingsRow'

interface CompanyCardProps {
  company: Company
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * A company as one line — «Ваня и Ксюша», «Ваня 54 % · Ксюша 46 %» under it; open — edited in place
 * the way «Кто ест» is in the calculator: the share bar (no «на завтра» here), people with ×,
 * and «+ Имя» to add the next one (docs/UX.md §3).
 */
export function CompanyCard({ company, open, onOpenChange }: CompanyCardProps) {
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  const deleteCompany = useAppStore((s) => s.deleteCompany)
  const holdMs = useAppStore((s) => s.holdMs)
  const weights = company.members.map((m) => m.weight)
  const percents = toPercents(weights)
  const shares = percentShares(weights)
  const personName = (m: CompanyMember, index: number) => m.name.trim() || `Человек ${index + 1}`
  // Each person's part, for the bar: percents only, there is no dish to weigh here.
  const segments: DishSegment[] = company.members.map((m, i) => ({ id: m.id, name: m.name, share: shares[i], label: null }))

  const save = (patch: Partial<Company>) => upsertCompany({ ...company, ...patch })
  const setMember = (id: string, patch: Partial<CompanyMember>) =>
    save({ members: company.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  const addMember = (name: string) =>
    save({ members: [...company.members, { id: newId(), name, weight: defaultShareWeight(weights) }] })
  const removeMember = (id: string) => save({ members: company.members.filter((m) => m.id !== id) })
  // The bar works in whole percents: shares become them.
  const setPercents = (next: number[]) =>
    save({ members: company.members.map((m, i) => ({ ...m, weight: next[i] ?? m.weight })) })

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
      <ShareSlider sharing={company.members} sharingSegments={segments} own={[]} rest={null} onChange={setPercents} />
      <ul className="flex flex-col divide-y">
        {company.members.map((m, index) => (
          <li key={m.id} className="flex items-center gap-2 py-1">
            <Input
              aria-label={`Имя ${index + 1}`}
              placeholder="Имя"
              value={m.name}
              enterKeyHint="done"
              onChange={(e) => setMember(m.id, { name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="h-11 border-transparent px-1 text-base font-medium shadow-none hover:border-input focus-visible:border-input"
            />
            {/* The part of the dish, here too: on the bar a narrow segment has no room for it. */}
            <span aria-hidden className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {percents[index]} %
            </span>
            <HoldButton
              holdMs={holdMs}
              className="w-10 text-muted-foreground"
              label={`Убрать ${m.name || 'человека'}`}
              hint="Удерживайте ×, чтобы убрать"
              onConfirm={() => removeMember(m.id)}
            >
              <XIcon />
            </HoldButton>
          </li>
        ))}
        {/* A new company is empty: the first name is typed right away. */}
        <AddPersonRow onAdd={addMember} autoFocus={company.members.length === 0} />
      </ul>
      <div className="flex justify-end">
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}>
          <Trash2Icon data-icon="inline-start" />
          Удалить
        </Button>
      </div>
    </SettingsRow>
  )
}
