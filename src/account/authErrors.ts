import { httpErrorText, NO_ANSWER_TEXT } from './networkText'

/** What went wrong with sign-in, in the words of docs/UX.md §6. */
export function authErrorText(error: { code?: string; status?: number } | null | undefined): string {
  if (!navigator.onLine) return 'Нет сети — войти можно, когда она появится'
  // No answer at all: the server is unreachable.
  if (!error || !error.status) return NO_ANSWER_TEXT
  switch (error.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'Неверная почта или пароль'
    case 'PASSWORD_TOO_SHORT':
      return 'Минимум 8 символов'
    case 'PASSWORD_TOO_LONG':
      return 'Максимум 128 символов'
    case 'INVALID_PASSWORD':
      return 'Неверный текущий пароль'
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'Такая почта уже зарегистрирована'
    case 'INVALID_EMAIL':
      return 'Неверный адрес почты'
    case 'INVALID_TOKEN':
      return 'Ссылка устарела — попроси новую'
    case 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED':
      return 'Passkey на этом устройстве уже добавлен'
    case 'SESSION_NOT_FRESH':
      return 'Чтобы добавить passkey, выйди и войди снова'
  }
  // The passkey prompt was closed, or there is no passkey for this site on the device.
  if (error.code === 'AUTH_CANCELLED' || error.code?.startsWith('ERROR_')) return 'Passkey не сработал — войди паролем'
  return httpErrorText(error.status)
}
