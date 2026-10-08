import { UsersIcon } from 'lucide-react'
import { lidFill } from '@/components/lids'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/store'
import { HubLink } from './HubLink'
import { t } from '@/i18n'
import { lineupName } from '@/i18n/format'

/**
 * «Компании» on the hub: each company as its people's lids, stacked like lids on containers, its
 * name and the shares — the same lids they get in the calculator, by place in the lineup.
 */
export function HubCompanies() {
  const companies = useAppStore((s) => s.companies)

  return (
    <HubLink
      to="companies"
      Icon={UsersIcon}
      title={t('settings.companies.title')}
      description={t(companies.length ? 'settings.hub.companiesHint' : 'settings.hub.companiesHintEmpty')}
    >
      {companies.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {companies.map((company) => (
            <li key={company.id} className="flex min-w-0 items-center gap-2.5 text-sm">
              <span aria-hidden className="flex shrink-0 -space-x-1">
                {company.members.slice(0, 10).map((m, i) => (
                  <span key={m.id} className={cn('size-3.5 rounded-[5px] ring-2 ring-card', lidFill(i))} />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {company.name.trim() || lineupName(company.members) || t('common.untitled')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HubLink>
  )
}
