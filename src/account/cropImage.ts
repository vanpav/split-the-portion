import { AVATAR_SIZE } from './types'

/** The part of the photo chosen on the crop screen, in the photo's own pixels (react-easy-crop). */
export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Cuts the chosen square out of the photo and scales it to the avatar size, as a JPEG: every phone
 * encodes it (Safari does not write WebP from a canvas), and 256×256 weighs 15–40 KB.
 * `createImageBitmap` turns the photo by its EXIF, as the crop screen showed it.
 */
export async function cropImage(src: string, area: CropArea): Promise<Blob> {
  const bitmap = await createImageBitmap(await (await fetch(src)).blob())
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no blob'))), 'image/jpeg', 0.85),
  )
}
