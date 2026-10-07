import { afterEach, describe, expect, it, vi } from 'vitest'
import { authErrorText } from '../authErrors'
import { GroupsApiError, OfflineError } from '../groupsApi'
import { groupErrorText } from '../networkText'

const online = (value: boolean) => vi.stubGlobal('navigator', { onLine: value })

afterEach(() => vi.unstubAllGlobals())

describe('groupErrorText', () => {
  it('tells offline from no answer from the server', () => {
    online(false)
    expect(groupErrorText(new OfflineError())).toBe('Нет сети — попробуй, когда она появится')
    online(true)
    expect(groupErrorText(new OfflineError())).toBe('Сервер не отвечает — попробуй через минуту')
  })

  it('has its own text per status', () => {
    online(true)
    expect(groupErrorText(new GroupsApiError(401))).toBe('Войди снова')
    expect(groupErrorText(new GroupsApiError(403))).toBe('Нет доступа к группе — попроси новое приглашение')
    expect(groupErrorText(new GroupsApiError(429))).toBe('Слишком много попыток — подожди минуту')
    expect(groupErrorText(new GroupsApiError(503))).toBe('Сбой на сервере — попробуй через минуту')
    expect(groupErrorText(new GroupsApiError(400))).toBe('Запрос не принят — обнови приложение и попробуй снова')
  })

  it('reads the status of the auth client error', () => {
    online(true)
    expect(groupErrorText({ status: 500 })).toBe('Сбой на сервере — попробуй через минуту')
  })

  it('does not blame the server for an error without a status', () => {
    online(true)
    expect(groupErrorText(new TypeError('x'))).toBe('Сбой в приложении — обнови страницу и попробуй снова')
  })
})

describe('authErrorText', () => {
  it('tells offline from no answer from the server', () => {
    online(false)
    expect(authErrorText({ status: 500 })).toBe('Нет сети — войти можно, когда она появится')
    online(true)
    expect(authErrorText(null)).toBe('Сервер не отвечает — попробуй через минуту')
  })

  it('names known codes', () => {
    online(true)
    expect(authErrorText({ code: 'INVALID_EMAIL', status: 400 })).toBe('Неверный адрес почты')
    expect(authErrorText({ code: 'PASSWORD_TOO_SHORT', status: 400 })).toBe('Минимум 8 символов')
    expect(authErrorText({ code: 'ERROR_X', status: 400 })).toBe('Passkey не сработал — войди паролем')
  })

  it('falls back by status, never to a catch-all', () => {
    online(true)
    expect(authErrorText({ status: 429 })).toBe('Слишком много попыток — подожди минуту')
    expect(authErrorText({ status: 502 })).toBe('Сбой на сервере — попробуй через минуту')
    expect(authErrorText({ status: 400 })).toBe('Запрос не принят — обнови приложение и попробуй снова')
  })
})
