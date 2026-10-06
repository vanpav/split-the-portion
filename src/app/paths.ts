import type { CookingKind, Id } from '@/domain'

/** Query parameter of the dish list tab; simple dishes are the default tab. */
export const LIST_TAB_PARAM = 'kind'

export const dishListPath = (kind: CookingKind) => (kind === 'composite' ? `/?${LIST_TAB_PARAM}=composite` : '/')
/** Opening a dish shows its calculator (docs/SPEC.md §3б). */
export const dishPath = (id: Id) => `/d/${id}`
export const dishHistoryPath = (id: Id) => `/d/${id}/history`
export const dishEditPath = (id: Id) => `/d/${id}/edit`
/** One form for both kinds; from — a simple dish to start a composite one with. */
export const newDishPath = (from?: Id) => (from ? `/d/new?from=${from}` : '/d/new')
export const cookingPath = (id: Id) => `/c/${id}`
/** Every saved cooking, in the tab bar. */
export const HISTORY_PATH = '/history'
/** Settings: on a phone the list of subsections, from `md` the menu with the first one open. */
export const SETTINGS_PATH = '/settings'
export const settingsPath = (section: string) => `${SETTINGS_PATH}/${section}`
/** Sign-in and sign-up (docs/UX.md «Вход»); `reset` — a new password by the link from the owner. */
export const ACCOUNT_PATH = '/account'
export const PASSWORD_RESET_PATH = '/account/reset'
export const isSettingsPath = (pathname: string) => pathname === SETTINGS_PATH || pathname.startsWith(`${SETTINGS_PATH}/`)
