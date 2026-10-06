import { Navigate, useParams } from 'react-router'
import { SETTINGS_PATH } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { ScreenHeader } from '@/components/ScreenHeader'
import { cn } from '@/lib/utils'
import { useSyncStore } from '@/store/sync'
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
  const inGroup = useSyncStore((s) => s.groupId !== null)
  const section = findSettingsSection(sectionParam)
  const { hasPrevious, noPreviousState } = useBack(SETTINGS_PATH)
  // «Группа» exists with an account only. Opened by a direct link, the list has no previous screen either.
  if (sectionParam !== undefined && (!section || (section.id === 'group' && !inGroup))) {
    return <Navigate to={SETTINGS_PATH} replace state={hasPrevious ? undefined : noPreviousState} />
  }

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
        <ScreenHeader title="Настройки" back backTo="/" backLabel="Калькулятор" />
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
