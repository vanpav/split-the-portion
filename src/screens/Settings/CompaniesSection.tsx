import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import type { Id } from '@/domain'
import { useAppStore } from '@/store/store'
import { CompanyCard } from './CompanyCard'
import { t } from '@/i18n'

export function CompaniesSection() {
  const companies = useAppStore((s) => s.companies)
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  // The company being edited; one at a time. A new one opens right away, empty: names go into «+ Имя».
  const [openId, setOpenId] = useState<Id | null>(null)

  const add = () => setOpenId(upsertCompany({ name: '', members: [] }))

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold max-md:sr-only">{t('settings.companies.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('settings.companies.lead')}
        </p>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            open={openId === company.id}
            onOpenChange={(open) => setOpenId(open ? company.id : null)}
          />
        ))}
        <li>
          <button
            type="button"
            onClick={add}
            className="flex min-h-14 w-full items-center gap-3 px-4 font-medium outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <PlusIcon className="size-4" />
            {t('calculator.addCompany')}
          </button>
        </li>
      </ul>
    </section>
  )
}
