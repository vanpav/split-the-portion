import { HardDriveIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppVersion } from './AppVersion'
import { HintsSetting } from './HintsSetting'
import { HubAccountCard } from './HubAccountCard'
import { HubCluster } from './HubCluster'
import { HubCompanies } from './HubCompanies'
import { HubLink } from './HubLink'
import { HubTares } from './HubTares'
import { CLUSTER_TITLES } from './sections'
import { ThemeSetting } from './ThemeSetting'

/**
 * `#/settings` on a phone (docs/UX.md «Настройки»): what is set up, read without opening anything —
 * where the data lives, the companies with their lids, the tares with their weights; the theme and
 * the hints are switched right here. Rows lead to the subsections' screens.
 */
export function SettingsHub({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-7', className)}>
      <HubAccountCard />
      <HubCluster title={CLUSTER_TITLES.kitchen}>
        <HubCompanies />
        <HubTares />
      </HubCluster>
      <HubCluster title={CLUSTER_TITLES.app} footer={<AppVersion />}>
        <div className="flex flex-col gap-2 px-3 pt-3 pb-2">
          <h3 className="px-1 font-medium">Тема</h3>
          <ThemeSetting />
        </div>
        <HintsSetting />
        <HubLink
          to="data"
          Icon={HardDriveIcon}
          title="Копия данных"
          description="Файл со всеми блюдами — на случай нового телефона"
        />
      </HubCluster>
    </div>
  )
}
