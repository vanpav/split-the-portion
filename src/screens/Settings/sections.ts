import { BookOpenIcon, HardDriveIcon, type LucideIcon, SunMoonIcon, UsersIcon, WeightIcon } from 'lucide-react'

export type SettingsSectionId = 'tares' | 'companies' | 'presets' | 'data' | 'appearance'

export interface SettingsSection {
  /** The last part of the address: `#/settings/<id>`. */
  id: SettingsSectionId
  title: string
  /** Under the title in the menu. */
  description: string
  Icon: LucideIcon
}

/** Settings subsections in menu order (docs/UX.md «Настройки»). The first one opens on `#/settings` from `md`. */
export const SETTINGS_SECTIONS: readonly [SettingsSection, ...SettingsSection[]] = [
  { id: 'tares', title: 'Тара', description: 'Вес пустой посуды', Icon: WeightIcon },
  { id: 'companies', title: 'Компании', description: 'Кто ест вместе', Icon: UsersIcon },
  { id: 'presets', title: 'Популярные блюда', description: 'Готовые рецепты для начала', Icon: BookOpenIcon },
  { id: 'data', title: 'Копия данных', description: 'Скачать или загрузить файл', Icon: HardDriveIcon },
  { id: 'appearance', title: 'Оформление', description: 'Светлая или тёмная тема', Icon: SunMoonIcon },
]

export const findSettingsSection = (id: string | undefined): SettingsSection | undefined =>
  SETTINGS_SECTIONS.find((s) => s.id === id)
