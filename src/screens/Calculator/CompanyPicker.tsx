import { BookmarkPlusIcon, ChartPieIcon, PlusIcon, UsersIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { NewCompanyDialog } from '@/components/NewCompanyDialog'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { lineupName, type Company, type Id } from '@/domain'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/store'

interface CompanyPickerProps {
  /** The company shown as picked; null — a lineup of its own. */
  value: Id | null
  /**
   * The company ticked in the list, when it differs from `value`: shares moved since picking
   * untick it, so picking it again brings its default shares back. Defaults to `value`.
   */
  ticked?: Id | null
  /** A company picked from the list, or just added in the dialog. */
  onChange: (company: Company) => void
  /** Shown when no company is picked, e.g. «Свой состав · 4». */
  customLabel?: string
  /** «Сохранить состав как компанию» at the end of the list; given only for a lineup of its own. */
  onSaveCurrent?: () => void
  /**
   * «Доли» after the companies (docs/SPEC.md §3б «Режим долей»): the dish in anonymous portions
   * instead of people. Without it there is no such item.
   */
  shares?: {
    /** «Доли» is picked: the field shows `label`, «Доли · 6». */
    active: boolean
    label: string
    onPick: () => void
  }
  /**
   * While «Доли» is picked and the dish's people have no company: «Свой состав · 4», back to them.
   * A dish whose people came from a company goes back by picking that company.
   */
  onOwnLineup?: () => void
  className?: string
}

/** List items that are actions, not values to keep selected. */
const SAVE = '__save__'
const ADD = '__add__'
const SHARES = '__shares__'
const OWN = '__own__'

/** No name typed: called by its people, as in the settings. */
function CompanyLabel({ company }: { company: Company }) {
  return (
    <>
      {company.name.trim() || lineupName(company.members)}{' '}
      <span className="text-muted-foreground">· {company.members.length}</span>
    </>
  )
}

/**
 * «Кто ест»: one compact select over the presets of the settings, then «Доли» — the dish in anonymous
 * portions instead of people. It ends with «Добавить компанию»: a new company is made in a dialog and
 * picked at once.
 */
export function CompanyPicker({
  value,
  ticked = value,
  onChange,
  customLabel = 'Свой состав',
  onSaveCurrent,
  shares,
  onOwnLineup,
  className,
}: CompanyPickerProps) {
  const companies = useAppStore((s) => s.companies)
  const inShares = shares?.active ?? false
  const shown = inShares ? undefined : companies.find((c) => c.id === value)
  const [adding, setAdding] = useState(false)
  // «Добавить компанию» picked: the dialog opens once the list has closed — the list keeps focus while open.
  const addPicked = useRef(false)

  const pick = (v: string) => {
    if (v === ADD) addPicked.current = true
    else if (v === SAVE) onSaveCurrent?.()
    else if (v === SHARES) shares?.onPick()
    else if (v === OWN) onOwnLineup?.()
    else {
      const company = companies.find((c) => c.id === v)
      if (company) onChange(company)
    }
  }

  return (
    <>
      <Select value={inShares ? SHARES : (ticked ?? '')} onValueChange={pick}>
        <SelectTrigger className={cn('justify-start', className)} aria-label="Кто ест">
          {inShares ? <ChartPieIcon className="text-muted-foreground" /> : <UsersIcon className="text-muted-foreground" />}
          <span className="flex min-w-0 flex-1 justify-start truncate">
            {/* The picked company stays named here even when its shares were moved and it is unticked. */}
            <SelectValue placeholder={shown ? <CompanyLabel company={shown} /> : customLabel}>
              {inShares ? shares?.label : shown && <CompanyLabel company={shown} />}
            </SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent
          onCloseAutoFocus={(e) => {
            if (!addPicked.current) return
            // Focus goes to the dialog («+ Имя») instead of back to the select.
            e.preventDefault()
            addPicked.current = false
            setAdding(true)
          }}
        >
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <CompanyLabel company={c} />
            </SelectItem>
          ))}
          {inShares && onOwnLineup && (
            <SelectItem value={OWN}>
              <UsersIcon />
              {customLabel}
            </SelectItem>
          )}
          {shares && (
            <SelectItem value={SHARES}>
              <ChartPieIcon />
              Доли
            </SelectItem>
          )}
          {(companies.length > 0 || shares) && <SelectSeparator />}
          {onSaveCurrent && (
            <SelectItem value={SAVE}>
              <BookmarkPlusIcon />
              Сохранить состав как компанию
            </SelectItem>
          )}
          <SelectItem value={ADD}>
            <PlusIcon />
            Добавить компанию
          </SelectItem>
        </SelectContent>
      </Select>
      <NewCompanyDialog open={adding} onOpenChange={setAdding} onCreated={onChange} />
    </>
  )
}
