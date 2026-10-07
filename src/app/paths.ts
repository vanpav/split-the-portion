import type { Id } from '@/domain'

/** The dish menu: one list with a search (`?q=…`), from 🔍 on the dish shelf. */
export const DISHES_PATH = '/dishes'
/** Opening a dish shows its calculator (docs/SPEC.md §3б). */
export const dishPath = (id: Id) => `/d/${id}`
export const dishEditPath = (id: Id) => `/d/${id}/edit`
/** Screens over the calculator (docs/UX.md §3а): it stays mounted under them, so «назад» finds it as it was. */
export const newTarePath = (id: Id) => `/d/${id}/tare/new`
export const newCompanyPath = (id: Id) => `/d/${id}/company/new`
/** Relative to the dish editor: «Из блюда», a screen over the form. */
export const FROM_SIMPLE_DISH = 'from-dish'
/** Relative to the dish editor: «Новая тара» from «+» in the tare chips. */
export const NEW_TARE = 'tare/new'
/** Relative to the calculator or a settings subsection: the text the clipboard refused, to copy by hand. */
export const COPY_TEXT = 'copy'
/** Under Settings → Группа: one group's screen — open it, its name, people, invite, leaving. */
export const GROUP_SCREEN = ':groupId'
export const groupPath = (groupId: string) => `${SETTINGS_PATH}/group/${groupId}`
/** Relative to Settings → Аккаунт: the photo chosen for the avatar, cut to a circle (docs/UX.md «Аккаунт и группа»). */
export const AVATAR_CROP = 'photo'
/** The photo goes with the navigation to `photo` as an object URL: shown, not stored. */
export interface AvatarCropState {
  photo: string
}
/** The text goes with the navigation to `copy`: it is shown, not stored. */
export interface CopyTextState {
  copyText: string
}
/** One form for both kinds; from — a simple dish to start a composite one with. */
export const newDishPath = (from?: Id) => (from ? `/d/new?from=${from}` : '/d/new')
/** «Создать «Хачапури»» in the dish search: the form starts with this text in «Что в блюде». */
export const newDishWithTextPath = (text: string) => `/d/new?${new URLSearchParams({ text })}`
/** Settings: on a phone the list of subsections, from `md` the menu with the first one open. */
export const SETTINGS_PATH = '/settings'
export const settingsPath = (section: string) => `${SETTINGS_PATH}/${section}`
/** Sign-in and sign-up (docs/UX.md «Вход»); `reset` — a new password by the link from the owner. */
export const ACCOUNT_PATH = '/account'
/** The sign-in screen with «Создать аккаунт» open, or with where to go after signing in. */
export const accountPath = ({ signUp, next }: { signUp?: boolean; next?: string }) => {
  const query = new URLSearchParams({ ...(signUp ? { tab: 'sign-up' } : {}), ...(next ? { next } : {}) }).toString()
  return query ? `${ACCOUNT_PATH}?${query}` : ACCOUNT_PATH
}
/** The welcome screen of a new device (docs/UX.md §3в). */
export const WELCOME_PATH = '/welcome'
export const PASSWORD_RESET_PATH = '/account/reset'
/** «Вступить по коду»: the code typed by hand, from Settings → «Группа». */
export const JOIN_PATH = '/join'
/** Join a group by an invite code (docs/UX.md «Вступить по ссылке»). */
export const joinPath = (code: string) => `/join/${code}`
/** «Создать группу»: the name typed on a screen of its own, from Settings → «Группа». */
export const NEW_GROUP_PATH = '/groups/new'
/**
 * «Популярные блюда» (docs/UX.md §3г): pick from the whole catalogue, set the weight, add at once.
 * `?group=1` — just after «Создать группу»: the lead text is about the new group and «Пропустить» leads to its settings.
 */
export const POPULAR_PATH = '/popular'
export const popularPath = ({ group }: { group?: boolean } = {}) => (group ? `${POPULAR_PATH}?group=1` : POPULAR_PATH)
