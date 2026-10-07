import { UsersIcon } from 'lucide-react'
import { lidFill } from '@/components/lids'
import { lineupName } from '@/domain'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/store'
import { HubLink } from './HubLink'

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
      title="Компании"
      description={companies.length ? 'Кто ест и в каких долях' : 'Кто ест и в каких долях. Пока ни одной'}
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
                {company.name.trim() || lineupName(company.members) || 'Без названия'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HubLink>
  )
}
