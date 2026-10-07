import type { Id } from '@/domain'

/** The dish menu: search, kind, sort (`?q=…&kind=…&sort=…`), from 🔍 on the dish shelf. */
export const DISHES_PATH = '/dishes'
/** Opening a dish shows its calculator (docs/SPEC.md §3б). */
export const dishPath = (id: Id) => `/d/${id}`
export const dishEditPath = (id: Id) => `/d/${id}/edit`
/** Screens over the calculator (docs/UX.md §3а): it stays mounted under them, so «назад» finds it as it was. */
export const newTarePath = (id: Id) => `/d/${id}/tare/new`
export const newCompanyPath = (id: Id) => `/d/${id}/company/new`
/** Relative to the dish editor: «Из простого блюда», a screen over the form. */
export const FROM_SIMPLE_DISH = 'from-dish'
/** Relative to the dish editor: «Новая тара» from «+» in the tare chips. */
export const NEW_TARE = 'tare/new'
/** Relative to the calculator or a settings subsection: the text the clipboard refused, to copy by hand. */
export const COPY_TEXT = 'copy'
/** The text goes with the navigation to `copy`: it is shown, not stored. */
export interface CopyTextState {
  copyText: string
}
/** One form for both kinds; from — a simple dish to start a composite one with. */
export const newDishPath = (from?: Id) => (from ? `/d/new?from=${from}` : '/d/new')
/** Settings: on a phone the list of subsections, from `md` the menu with the first one open. */
export const SETTINGS_PATH = '/settings'
export const settingsPath = (section: string) => `${SETTINGS_PATH}/${section}`
/** Sign-in and sign-up (docs/UX.md «Вход»); `reset` — a new password by the link from the owner. */
export const ACCOUNT_PATH = '/account'
export const PASSWORD_RESET_PATH = '/account/reset'
/** «Вступить по коду»: the code typed by hand, from Settings → «Группа». */
export const JOIN_PATH = '/join'
/** Join a group by an invite code (docs/UX.md «Вступить по ссылке»). */
export const joinPath = (code: string) => `/join/${code}`
