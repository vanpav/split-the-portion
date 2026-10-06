import { Navigate, useParams } from 'react-router'
import { SETTINGS_PATH } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import { cn } from '@/lib/utils'
import { findSettingsSection, SETTINGS_SECTIONS } from './sections'
import { SettingsMenu } from './SettingsMenu'
import { SettingsSectionContent } from './SettingsSectionContent'

/**
 * `#/settings` and `#/settings/:section` (docs/UX.md «Настройки»).
 * Phone: either the list of subsections or one subsection with «←» back to the list.
 * From `md`: the menu on the left, the subsection on the right (the first one on `#/settings`).
 * Switched by breakpoint classes only, so nothing reads the screen width.
 */
export function SettingsScreen() {
  const { section: sectionParam } = useParams()
  const section = findSettingsSection(sectionParam)
  if (sectionParam !== undefined && !section) return <Navigate to={SETTINGS_PATH} replace />

  const shown = section ?? SETTINGS_SECTIONS[0]

  return (
    <>
      {/* `contents` keeps the header sticky. A subsection on a phone has its own header leading back to the list. */}
      {section && (
        <div className="contents md:hidden">
          <ScreenHeader title={section.title} back backTo={SETTINGS_PATH} backLabel="Настройки" />
        </div>
      )}
      <div className={section ? 'hidden md:contents' : 'contents'}>
        <ScreenHeader title="Настройки" />
      </div>
      <main className="mx-auto grid w-full max-w-2xl flex-1 grid-cols-[minmax(0,1fr)] content-start gap-8 p-4 md:max-w-5xl md:grid-cols-[13rem_minmax(0,1fr)] md:items-start lg:py-8">
        <SettingsMenu
          current={section?.id}
          shown={section ? undefined : shown.id}
          className={cn('md:sticky md:top-20', section && 'max-md:hidden')}
        />
        <div className={cn('min-w-0', !section && 'max-md:hidden')}>
          <SettingsSectionContent key={shown.id} id={shown.id} />
        </div>
      </main>
    </>
  )
}
