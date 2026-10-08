import {
  CircleUserIcon,
  HardDriveIcon,
  HouseIcon,
  type LucideIcon,
  SunMoonIcon,
  UsersIcon,
  WeightIcon,
} from 'lucide-react'
import { t } from '@/i18n'

export type SettingsSectionId = 'account' | 'group' | 'companies' | 'tares' | 'data' | 'appearance'

/**
 * What a subsection is about, so «Группа» (who shares the data) and «Компании» (who eats, in what
 * shares) never sit side by side: the account with its group, the kitchen, the app itself.
 */
export type SettingsCluster = 'account' | 'kitchen' | 'app'

export interface SettingsSection {
  /** The last part of the address: `#/settings/<id>`. */
  id: SettingsSectionId
  /** In the UI language now: read when shown. */
  readonly title: string
  cluster: SettingsCluster
  Icon: LucideIcon
}

/** Heading of a cluster; the account goes first and needs none. */
export const clusterTitle = (cluster: SettingsCluster): string | null => (cluster === 'account' ? null : t(`settings.clusters.${cluster}`))

/** Settings subsections in menu order (docs/UX.md «Настройки»). The first one opens on `#/settings` from `md`. */
export const SETTINGS_SECTIONS: readonly [SettingsSection, ...SettingsSection[]] = [
  { id: 'account', get title() { return t('settings.sections.account') }, cluster: 'account', Icon: CircleUserIcon },
  // Only with an account (SettingsMenu, SettingsScreen).
  { id: 'group', get title() { return t('settings.sections.group') }, cluster: 'account', Icon: HouseIcon },
  { id: 'companies', get title() { return t('settings.sections.companies') }, cluster: 'kitchen', Icon: UsersIcon },
  { id: 'tares', get title() { return t('settings.sections.tares') }, cluster: 'kitchen', Icon: WeightIcon },
  { id: 'appearance', get title() { return t('settings.sections.appearance') }, cluster: 'app', Icon: SunMoonIcon },
  { id: 'data', get title() { return t('settings.sections.data') }, cluster: 'app', Icon: HardDriveIcon },
]

export const findSettingsSection = (id: string | undefined): SettingsSection | undefined =>
  SETTINGS_SECTIONS.find((s) => s.id === id)
