import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// App icons from public/favicon.svg: `pnpm icons` writes the PNGs to public/ (committed).
// The drawing keeps to the maskable safe zone, so no padding; the cobalt ground fills
// the rounded corners where a platform needs a square (Android maskable, iOS home screen).
const ground = { background: '#2f5bd3', fit: 'contain' } as const

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: ground },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: ground },
  },
  images: ['public/favicon.svg'],
})
