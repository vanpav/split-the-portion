import { httpErrorText, noAnswerText } from './networkText'
import { t } from '@/i18n'

/** What went wrong with sign-in, in the words of docs/UX.md §6. */
export function authErrorText(error: { code?: string; status?: number } | null | undefined): string {
  if (!navigator.onLine) return t('account.errors.offlineSignIn')
  // No answer at all: the server is unreachable.
  if (!error || !error.status) return noAnswerText()
  switch (error.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return t('account.errors.wrongCredentials')
    case 'PASSWORD_TOO_SHORT':
      return t('account.errors.passwordShort')
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return t('account.errors.emailTaken')
    case 'INVALID_EMAIL':
      return t('account.errors.emailInvalid')
    case 'INVALID_TOKEN':
      return t('account.errors.linkExpired')
    case 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED':
      return t('account.errors.passkeyExists')
    case 'SESSION_NOT_FRESH':
      return t('account.errors.passkeyReauth')
  }
  // The passkey prompt was closed, or there is no passkey for this site on the device.
  if (error.code === 'AUTH_CANCELLED' || error.code?.startsWith('ERROR_')) return t('account.errors.passkeyFailed')
  return httpErrorText(error.status)
}
