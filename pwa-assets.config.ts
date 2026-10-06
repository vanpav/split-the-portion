import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// App icons from public/favicon.svg: `pnpm icons` writes the PNGs to public/ (committed).
// The navy-ink ground fills the rounded corners where a platform needs a square (Android maskable,
// iOS home screen); it is the tile's own color, so the seam does not show.
const ground = { background: '#1b2440', fit: 'contain' } as const

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    // The drawing reaches 44 % of the width from the center; Android's safe circle is 40 %,
    // so the maskable icon needs at least 9 % padding.
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: ground },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: ground },
  },
  images: ['public/favicon.svg'],
})
