import { useState } from 'react'
import { Navigate, useNavigationType, useOutlet, useParams } from 'react-router'
import { settingsSwitchAnimation, type SettingsSwitch } from '@/app/enterAnimation'
import { OverScreen } from '@/app/OverScreen'
import { SETTINGS_PATH } from '@/app/paths'
import { screenEnterClass, useReturnAnimation } from '@/app/screenAnimation'
import { useBack } from '@/app/useBack'
import { ScreenHeader } from '@/components/ScreenHeader'
import { cn } from '@/lib/utils'
import { useSyncStore } from '@/store/sync'
import { findSettingsSection, SETTINGS_SECTIONS, type SettingsSectionId } from './sections'
import { SettingsHub } from './SettingsHub'
import { SettingsMenu } from './SettingsMenu'
import { SettingsSectionContent } from './SettingsSectionContent'

const NO_SWITCH: SettingsSwitch = { page: 'none', content: 'none' }

const menuPlace = (id: SettingsSectionId) => SETTINGS_SECTIONS.findIndex((s) => s.id === id)

/**
 * `#/settings` and `#/settings/:section` (docs/UX.md «Настройки»), one screen for the screen
 * transition (`screenKey`): a subsection changes inside it (`settingsSwitchAnimation`).
 * Phone: either the hub (SettingsHub; its links add an entry) or one subsection with «←» back to it.
 * From `md`: the menu on the left (its links replace the address, so «назад» leaves the settings),
 * the subsection on the right (the first one on `#/settings`).
 * Switched by breakpoint classes only, so nothing reads the screen width.
 * A screen over a subsection (`#/settings/:section/copy`) keeps it mounted and hidden under it.
 */
export function SettingsScreen() {
  const { section: sectionParam } = useParams()
  const navigationType = useNavigationType()
  const inGroup = useSyncStore((s) => s.groupId !== null)
  const section = findSettingsSection(sectionParam)
  const { hasPrevious, noPreviousState } = useBack(SETTINGS_PATH)
  const outlet = useOutlet()
  const returnAnimation = useReturnAnimation(outlet !== null)
  // The subsection in the address and how it came in; the one the screen opened with arrives with
  // the screen's own transition, not a second one.
  // `page` counts the page changes: the page box remounts (and animates) on those only, so the menu
  // beside a subsection keeps its focus when it switches the content.
  const [state, setState] = useState<{ section: string | undefined; animation: SettingsSwitch; page: number }>({
    section: sectionParam,
    animation: NO_SWITCH,
    page: 0,
  })
  // «Группа» exists with an account only. Opened by a direct link, the list has no previous screen either.
  if (sectionParam !== undefined && (!section || (section.id === 'group' && !inGroup))) {
    // The redirect is not a switch: the list comes in without a second animation.
    if (state.section !== undefined) setState({ ...state, section: undefined, animation: NO_SWITCH })
    return <Navigate to={SETTINGS_PATH} replace state={hasPrevious ? undefined : noPreviousState} />
  }

  const shown = section ?? SETTINGS_SECTIONS[0]
  let { animation, page } = state
  if (state.section !== sectionParam) {
    const before = findSettingsSection(state.section) ?? SETTINGS_SECTIONS[0]
    animation = settingsSwitchAnimation({ from: menuPlace(before.id), to: menuPlace(shown.id), navigationType })
    if (animation.page !== 'none') page += 1
    setState({ section: sectionParam, animation, page })
  }

  return (
    <>
      <div hidden={outlet !== null} className={cn('flex flex-1 flex-col', returnAnimation)}>
        {/* The phone's list and a subsection are different pages of the screen; from `md` the menu only changes the content. */}
        <div key={page} className={cn('flex flex-1 flex-col', screenEnterClass(animation.page))}>
          {/* The header stays sticky: this box is as tall as the screen. A subsection on a phone has its own header leading back to the list. */}
          {section && (
            <div className="contents md:hidden">
              <ScreenHeader title={section.title} back backTo={SETTINGS_PATH} backLabel="Настройки" />
            </div>
          )}
          <div className={section ? 'hidden md:contents' : 'contents'}>
            <ScreenHeader title="Настройки" back backTo="/" backLabel="Калькулятор" />
          </div>
          <main className="mx-auto grid w-full max-w-2xl flex-1 grid-cols-[minmax(0,1fr)] content-start gap-8 p-4 md:max-w-5xl md:grid-cols-[13rem_minmax(0,1fr)] md:items-start lg:py-8">
            {!section && <SettingsHub className="md:hidden" />}
            <SettingsMenu
              current={section?.id}
              shown={section ? undefined : shown.id}
              className="max-md:hidden md:sticky md:top-20"
            />
            <div
              key={shown.id}
              className={cn(
                'min-w-0',
                !section && 'max-md:hidden',
                animation.content !== 'none' &&
                  'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-safe:ease-out',
                animation.content === 'forward' && 'motion-safe:slide-in-from-bottom-2',
                animation.content === 'back' && 'motion-safe:slide-in-from-top-2',
              )}
            >
              <SettingsSectionContent id={shown.id} />
            </div>
          </main>
        </div>
      </div>
      {outlet && <OverScreen>{outlet}</OverScreen>}
    </>
  )
}
