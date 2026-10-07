/** What went wrong with sign-in, in the words of docs/UX.md §6. */
export function authErrorText(error: { code?: string; status?: number } | null | undefined): string {
  // No answer at all: the phone is offline (or the server is unreachable, which looks the same).
  if (!error || !error.status || !navigator.onLine) return 'Нет сети — войти можно, когда она появится'
  switch (error.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'Неверная почта или пароль'
    case 'PASSWORD_TOO_SHORT':
      return 'Пароль — не короче 8 символов'
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'Такая почта уже зарегистрирована'
    case 'INVALID_EMAIL':
      return 'Проверьте почту'
    case 'INVALID_TOKEN':
      return 'Ссылка устарела — попросите новую'
    case 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED':
      return 'Passkey на этом устройстве уже добавлен'
    case 'SESSION_NOT_FRESH':
      return 'Чтобы добавить passkey, выйдите и войдите снова'
  }
  // The passkey prompt was closed, or there is no passkey for this site on the device.
  if (error.code === 'AUTH_CANCELLED' || error.code?.startsWith('ERROR_')) return 'Passkey не сработал — войдите паролем'
  return error.status === 429 ? 'Слишком много попыток — подождите минуту' : 'Не получилось — попробуйте ещё раз'
}
