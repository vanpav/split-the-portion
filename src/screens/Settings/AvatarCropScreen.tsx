import { ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { Navigate, useLocation, useResolvedPath } from 'react-router'
import { toast } from 'sonner'
import { cropImage, type CropArea } from '@/account/cropImage'
import { groupErrorText } from '@/account/networkText'
import { profileApi } from '@/account/profileApi'
import { refreshAccount } from '@/account/refreshAccount'
import type { AvatarCropState } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { t } from '@/i18n'

const photoOf = (state: unknown) =>
  typeof state === 'object' && state !== null && 'photo' in state && typeof (state as AvatarCropState).photo === 'string'
    ? (state as AvatarCropState).photo
    : null

const MAX_ZOOM = 4

/**
 * `#/settings/account/photo` (docs/UX.md «Аккаунт и группа»): the chosen photo under a round window;
 * drag and pinch (or the slider) to fit the face, «Сохранить» cuts it to 256×256 and sends it.
 * Settings stay mounted under it. Without a photo (typed in by hand, a reload) — back to them.
 */
export function AvatarCropScreen() {
  const photo = photoOf(useLocation().state)
  const { pathname: from } = useResolvedPath('..')
  const { back } = useBack(from)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<CropArea | null>(null)
  const [busy, setBusy] = useState(false)

  if (photo === null) return <Navigate to={from} replace />

  const save = async () => {
    if (!area) return
    setBusy(true)
    try {
      await profileApi.uploadAvatar(await cropImage(photo, area))
      await refreshAccount()
      URL.revokeObjectURL(photo)
      back()
    } catch (e) {
      toast(groupErrorText(e))
      setBusy(false)
    }
  }

  return (
    <>
      <ScreenHeader title={t('settings.avatar.title')} back backTo={from} backLabel={t('account.title')} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4">
        <p className="px-1 text-sm text-muted-foreground">{t('settings.avatar.lead')}</p>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-card">
          <Cropper
            image={photo}
            crop={crop}
            zoom={zoom}
            maxZoom={MAX_ZOOM}
            aspect={1}
            cropShape="round"
            showGrid={false}
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            // Outside the circle the photo sinks under the frosted ground, not under black.
            style={{ cropAreaStyle: { border: '2px solid var(--card)', color: 'color-mix(in oklab, var(--background) 72%, transparent)' } }}
          />
        </div>
        <div className="flex items-center gap-3 px-1">
          <ZoomOutIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <Slider
            aria-label={t('settings.avatar.zoom')}
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={[zoom]}
            onValueChange={([z]) => setZoom(z)}
            className="flex-1"
          />
          <ZoomInIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        </div>
        <BottomBar>
          <Button size="lg" variant="outline" className="flex-1 lg:flex-none" onClick={back}>
            {t('common.cancel')}
          </Button>
          <Button size="lg" className="flex-1 lg:flex-none" disabled={busy || !area} onClick={() => void save()}>
            {t(busy ? 'common.saving' : 'common.save')}
          </Button>
        </BottomBar>
      </main>
    </>
  )
}
