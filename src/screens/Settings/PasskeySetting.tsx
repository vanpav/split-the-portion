import { KeyRoundIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { shortDate } from '@/domain/dates'

type Passkey = { id: string; name?: string | null; createdAt: Date | string }

/** The server names a passkey after its password manager; an unknown one is just «Passkey». */
const label = (passkey: Passkey) => passkey.name || 'Passkey'

/**
 * «Passkey»: every passkey of the account, one per device or password manager, each can be
 * removed; «Добавить passkey» adds this device's (docs/UX.md «Аккаунт и группа»).
 */
export function PasskeySetting() {
  const { data: passkeys } = authClient.useListPasskeys()
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState<Passkey | null>(null)

  const add = async () => {
    setBusy(true)
    try {
      const { error } = await authClient.passkey.addPasskey()
      if (!error) toast('Passkey добавлен')
      // A closed prompt is the user's choice, not an error worth a message.
      else if (
        !error.status ||
        ('code' in error && (error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' || error.code === 'SESSION_NOT_FRESH'))
      )
        toast(authErrorText(error))
    } catch {
      toast(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (passkey: Passkey) => {
    setBusy(true)
    try {
      const { error } = await authClient.passkey.deletePasskey({ id: passkey.id })
      toast(error ? authErrorText(error) : 'Passkey удалён')
    } catch {
      toast(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {passkeys && passkeys.length > 0 && (
        <>
          <h3 className="px-1 text-sm text-muted-foreground">Passkey</h3>
          <ItemGroup className="gap-1">
            {passkeys.map((passkey) => (
              <Item key={passkey.id} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <KeyRoundIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{label(passkey)}</ItemTitle>
                  <ItemDescription>Добавлен {shortDate(passkey.createdAt)}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label={`Удалить passkey «${label(passkey)}»`}
                    disabled={busy}
                    onClick={() => setRemoving(passkey)}
                  >
                    <Trash2Icon />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </>
      )}
      <Button variant="outline" className="md:self-start" disabled={busy} onClick={() => void add()}>
        <PlusIcon data-icon="inline-start" />
        Добавить passkey
      </Button>
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить passkey «{removing ? label(removing) : ''}»?</AlertDialogTitle>
            <AlertDialogDescription>Войти с ним больше не получится. Пароль и другие passkey останутся.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => removing && void remove(removing)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
