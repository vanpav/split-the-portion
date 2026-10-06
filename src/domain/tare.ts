/**
 * The tare weight slider: a quick rough value next to the exact field. From a plastic box (tens
 * of grams) to a big pot or a cast-iron pan (about 3 kg), in 10 g steps; heavier tares are typed.
 */
export const TARE_SLIDER = { min: 10, max: 3000, step: 10 } as const

/** Where the slider stands for a typed weight: clamped to its range; nothing typed — at the start. */
export function tareSliderPosition(grams: number | null): number {
  if (grams === null || !Number.isFinite(grams)) return TARE_SLIDER.min
  return Math.min(TARE_SLIDER.max, Math.max(TARE_SLIDER.min, grams))
}

/** The weight a slider position gives: the nearest step inside the range. */
export function tareGramsFromSlider(position: number): number {
  const { min, max, step } = TARE_SLIDER
  const snapped = Math.round(position / step) * step
  return Math.min(max, Math.max(min, snapped))
}
