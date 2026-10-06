import { BookmarkPlusIcon, UsersIcon } from 'lucide-react'
import { Link } from 'react-router'
import { settingsPath } from '@/app/paths'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { lineupName, type Id } from '@/domain'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/store'

interface CompanyPickerProps {
  /** The preset the people match; null — a lineup of its own. */
  value: Id | null
  onChange: (id: Id) => void
  /** Shown when the people match no preset, e.g. «Свой состав · 4». */
  customLabel?: string
  /** «Сохранить состав как компанию» at the end of the list; given only for a lineup of its own. */
  onSaveCurrent?: () => void
  className?: string
}

/** The list item that saves the lineup: an action, not a value to keep selected. */
const SAVE = '__save__'

/** «Кто ест»: one compact select over the presets of the settings, or where to create one. */
export function CompanyPicker({ value, onChange, customLabel = 'Свой состав', onSaveCurrent, className }: CompanyPickerProps) {
  const companies = useAppStore((s) => s.companies)
  if (companies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Кто с кем ест и в каком соотношении — в{' '}
        <Link to={settingsPath('companies')} className="text-foreground underline underline-offset-4">
          настройках
        </Link>
        .
      </p>
    )
  }

  return (
    <Select value={value ?? ''} onValueChange={(v) => (v === SAVE ? onSaveCurrent?.() : onChange(v))}>
      <SelectTrigger className={cn('justify-start', className)} aria-label="Кто ест">
        <UsersIcon className="text-muted-foreground" />
        <span className="flex min-w-0 flex-1 justify-start truncate">
          <SelectValue placeholder={customLabel} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {companies.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {/* No name typed: called by its people, as in the settings. */}
            {c.name.trim() || lineupName(c.members)}{' '}
            <span className="text-muted-foreground">· {c.members.length}</span>
          </SelectItem>
        ))}
        {onSaveCurrent && (
          <>
            <SelectSeparator />
            <SelectItem value={SAVE}>
              <BookmarkPlusIcon />
              Сохранить состав как компанию
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  )
}
