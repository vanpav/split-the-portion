import { authClient } from './authClient'

/** WebAuthn Signal API (Safari 26, Chrome 132): not in the DOM types yet. */
type Signal = { signalUnknownCredential?: (o: { rpId: string; credentialId: string }) => Promise<void> }

/** The credential ids of the account's passkeys; asked before the account is deleted, while it still exists. */
export async function passkeyIds(): Promise<string[]> {
  try {
    const { data } = await authClient.passkey.listUserPasskeys()
    return data?.map((p) => p.credentialID) ?? []
  } catch {
    return []
  }
}

/**
 * After «Удалить аккаунт»: tells the password manager (iCloud Keychain, Google Password Manager)
 * that these passkeys are gone, so it stops offering them. Browsers without the Signal API keep
 * them; signing in with one then just fails.
 */
export function forgetPasskeys(ids: readonly string[]) {
  const api = window.PublicKeyCredential as (typeof PublicKeyCredential & Signal) | undefined
  if (!api?.signalUnknownCredential) return
  for (const credentialId of ids) void api.signalUnknownCredential({ rpId: location.hostname, credentialId }).catch(() => undefined)
}
