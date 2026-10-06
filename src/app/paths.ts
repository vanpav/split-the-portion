import type { Id } from '@/domain'

/** The dish menu: search, kind, sort (`?q=…&kind=…&sort=…`), from 🔍 on the dish shelf. */
export const DISHES_PATH = '/dishes'
/** Opening a dish shows its calculator (docs/SPEC.md §3б). */
export const dishPath = (id: Id) => `/d/${id}`
export const dishEditPath = (id: Id) => `/d/${id}/edit`
/** One form for both kinds; from — a simple dish to start a composite one with. */
export const newDishPath = (from?: Id) => (from ? `/d/new?from=${from}` : '/d/new')
/** Settings: on a phone the list of subsections, from `md` the menu with the first one open. */
export const SETTINGS_PATH = '/settings'
export const settingsPath = (section: string) => `${SETTINGS_PATH}/${section}`
/** Sign-in and sign-up (docs/UX.md «Вход»); `reset` — a new password by the link from the owner. */
export const ACCOUNT_PATH = '/account'
export const PASSWORD_RESET_PATH = '/account/reset'
/** Join a group by an invite code (docs/UX.md «Вступить по ссылке»). */
export const joinPath = (code: string) => `/join/${code}`
