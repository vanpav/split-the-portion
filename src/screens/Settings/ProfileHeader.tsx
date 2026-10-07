import { CameraIcon, ImageIcon, Trash2Icon } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { groupErrorText } from '@/account/networkText'
import { fullName, shortName } from '@/account/profile'
import { profileApi } from '@/account/profileApi'
import { refreshAccount } from '@/account/refreshAccount'
import type { Me } from '@/account/types'
import { AVATAR_CROP, settingsPath, type AvatarCropState } from '@/app/paths'
import { PersonAvatar } from '@/components/PersonAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SyncStatusLine } from './SyncStatusLine'

/** The round camera mark on the avatar, the hint that a tap changes the photo. */
const BADGE =
  'absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-foreground text-background ring-4 ring-card'
const AVATAR_BUTTON =
  'relative rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] transition-transform'

/**
 * The top of «Аккаунт»: the photo (a tap picks one; with a photo — a menu to pick another or take it
 * off), the name as others read it, the email and how the sync is doing.
 */
export function ProfileHeader({ user }: { user: Me['user'] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const name = fullName(user)

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return void toast('Это не фото — выбери снимок из галереи')
    const state: AvatarCropState = { photo: URL.createObjectURL(file) }
    navigate(`${settingsPath('account')}/${AVATAR_CROP}`, { state })
  }

  const remove = async () => {
    setBusy(true)
    try {
      await profileApi.removeAvatar()
      await refreshAccount()
      toast('Фото убрано')
    } catch (e) {
      toast(groupErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  const avatar = (
    <>
      <PersonAvatar person={user} className="size-24 text-3xl" />
      <span aria-hidden className={BADGE}>
        <CameraIcon className="size-4" />
      </span>
    </>
  )

  return (
    <section aria-label="Профиль" className="flex flex-col items-center gap-3 rounded-xl border bg-card px-4 pt-6 pb-5 text-center">
      {user.image ? (
        <DropdownMenu>
          <DropdownMenuTrigger className={AVATAR_BUTTON} aria-label="Фото профиля" disabled={busy}>
            {avatar}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {/* The menu closes first, then the system's photo picker opens. */}
            <DropdownMenuItem className="min-h-11 text-base" onSelect={() => inputRef.current?.click()}>
              <ImageIcon />
              Выбрать другое фото
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 text-base" variant="destructive" onSelect={() => void remove()}>
              <Trash2Icon />
              Убрать фото
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button type="button" className={AVATAR_BUTTON} aria-label="Добавить фото" onClick={() => inputRef.current?.click()}>
          {avatar}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      <div className="flex min-w-0 max-w-full flex-col items-center gap-0.5">
        <h2 className="max-w-full truncate text-xl font-semibold">{name || shortName(user)}</h2>
        <p className="max-w-full truncate text-sm text-muted-foreground">
          {name ? `${shortName(user)} · ${user.email}` : user.email}
        </p>
      </div>
      <SyncStatusLine />
    </section>
  )
}
