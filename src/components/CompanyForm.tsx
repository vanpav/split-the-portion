import { XIcon } from 'lucide-react'
import { AddPersonRow } from '@/components/AddPersonRow'
import { HoldButton } from '@/components/HoldButton'
import { ShareSlider, type DishSegment } from '@/components/ShareSlider'
import { Input } from '@/components/ui/input'
import { defaultShareWeight, exactPercents, formatPercent, lineupName, type Company, type CompanyMember } from '@/domain'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'

/** What the form edits: a company without its id (a new one has none yet). */
export type CompanyDraft = Pick<Company, 'name' | 'members'>

interface CompanyFormProps {
  value: CompanyDraft
  onChange: (next: CompanyDraft) => void
  /** Focus «+ Имя» when there is nobody yet: a new company starts with typing its first name. */
  autoFocus?: boolean
}

/**
 * A company edited the way «Кто ест» is in the calculator: name, the share bar (no «на завтра»
 * here, there is no dish), people with × held, and «+ Имя» for the next one (docs/UX.md §3).
 * The same form in the settings and on the calculator's «Новая компания» screen.
 */
export function CompanyForm({ value, onChange, autoFocus }: CompanyFormProps) {
  const holdMs = useAppStore((s) => s.holdMs)
  const { members } = value
  const weights = members.map((m) => m.weight)
  // Each person's part, exact: «Поровну» on three is 33,3 % each, not 34, 33, 33. The bar shows percents only.
  const shares = exactPercents(weights).map((p) => p / 100)
  const segments: DishSegment[] = members.map((m, i) => ({ id: m.id, place: i, name: m.name, share: shares[i], label: null }))

  const setMembers = (next: CompanyMember[]) => onChange({ ...value, members: next })
  const setMember = (id: string, patch: Partial<CompanyMember>) =>
    setMembers(members.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  const addMember = (name: string) =>
    setMembers([...members, { id: newId(), name, weight: defaultShareWeight(weights) }])
  const removeMember = (id: string) => setMembers(members.filter((m) => m.id !== id))
  // The bar works in whole percents: shares become them.
  const setPercents = (next: number[]) => setMembers(members.map((m, i) => ({ ...m, weight: next[i] ?? m.weight })))

  return (
    <div className="flex flex-col gap-3">
      <Input
        aria-label="Название компании"
        placeholder={lineupName(members) || 'Ваня и Ксюша'}
        className="font-medium"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <ShareSlider sharing={members} sharingSegments={segments} own={[]} rest={null} onChange={setPercents} />
      <ul className="flex flex-col divide-y">
        {members.map((m, index) => (
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
              {formatPercent(shares[index])} %
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
        <AddPersonRow onAdd={addMember} autoFocus={autoFocus && members.length === 0} />
      </ul>
    </div>
  )
}
