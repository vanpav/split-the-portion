import { CheckIcon, ScanFaceIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
import { Button } from '@/components/ui/button'

/** «Добавить вход по Face ID»: a passkey of this device for this site (docs/UX.md «Аккаунт и группа»). */
export function PasskeySetting() {
  const { data: passkeys } = authClient.useListPasskeys()
  const [busy, setBusy] = useState(false)

  const add = async () => {
    setBusy(true)
    try {
      const { error } = await authClient.passkey.addPasskey()
      if (!error) toast('Face ID добавлен')
      // A closed prompt is the user's choice, not an error worth a message.
      else if (!error.status || ('code' in error && error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED'))
        toast(authErrorText(error))
    } catch {
      toast(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  if (passkeys && passkeys.length > 0) {
    return (
      <p className="flex items-center gap-2 px-1 text-sm">
        <CheckIcon className="size-4 text-muted-foreground" />
        Face ID добавлен
      </p>
    )
  }
  return (
    <Button variant="outline" className="md:self-start" disabled={busy} onClick={() => void add()}>
      <ScanFaceIcon data-icon="inline-start" />
      Добавить вход по Face ID
    </Button>
  )
}
