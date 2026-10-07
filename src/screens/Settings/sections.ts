import {
  CircleUserIcon,
  HardDriveIcon,
  HouseIcon,
  type LucideIcon,
  SunMoonIcon,
  UsersIcon,
  WeightIcon,
} from 'lucide-react'

export type SettingsSectionId = 'account' | 'group' | 'companies' | 'tares' | 'data' | 'appearance'

/**
 * What a subsection is about, so «Группа» (who shares the data) and «Компании» (who eats, in what
 * shares) never sit side by side: the account with its group, the kitchen, the app itself.
 */
export type SettingsCluster = 'account' | 'kitchen' | 'app'

export interface SettingsSection {
  /** The last part of the address: `#/settings/<id>`. */
  id: SettingsSectionId
  title: string
  cluster: SettingsCluster
  Icon: LucideIcon
}

/** Headings of the clusters; the account goes first and needs none. */
export const CLUSTER_TITLES = {
  account: null,
  kitchen: 'Кухня',
  app: 'Приложение',
} as const satisfies Record<SettingsCluster, string | null>

/** Settings subsections in menu order (docs/UX.md «Настройки»). The first one opens on `#/settings` from `md`. */
export const SETTINGS_SECTIONS: readonly [SettingsSection, ...SettingsSection[]] = [
  { id: 'account', title: 'Аккаунт', cluster: 'account', Icon: CircleUserIcon },
  // Only with an account (SettingsMenu, SettingsScreen).
  { id: 'group', title: 'Группа', cluster: 'account', Icon: HouseIcon },
  { id: 'companies', title: 'Компании', cluster: 'kitchen', Icon: UsersIcon },
  { id: 'tares', title: 'Тара', cluster: 'kitchen', Icon: WeightIcon },
  { id: 'appearance', title: 'Оформление', cluster: 'app', Icon: SunMoonIcon },
  { id: 'data', title: 'Копия данных', cluster: 'app', Icon: HardDriveIcon },
]

export const findSettingsSection = (id: string | undefined): SettingsSection | undefined =>
  SETTINGS_SECTIONS.find((s) => s.id === id)
