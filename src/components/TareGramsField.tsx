import { NumberField } from '@/components/NumberField'
import { Slider } from '@/components/ui/slider'
import { formatGrams, isValidTareGrams, TARE_SLIDER, tareGramsFromSlider, tareSliderPosition } from '@/domain'

interface TareGramsFieldProps {
  value: number | null
  onValueChange: (grams: number | null) => void
  label?: string
  ariaLabel?: string
}

/**
 * A tare's weight two ways: exactly in the field, or roughly with the slider under it.
 * Both show one value; a weight past the slider's range is typed and the slider stays at its end.
 */
export function TareGramsField({ value, onValueChange, label, ariaLabel }: TareGramsFieldProps) {
  const name = label ?? ariaLabel ?? 'Вес тары'
  return (
    <div className="flex flex-col gap-1">
      <NumberField
        label={label}
        ariaLabel={ariaLabel}
        placeholder="850"
        value={value}
        validate={(grams) => (grams === null || isValidTareGrams(grams) ? null : 'Вес должен быть больше 0')}
        onValueChange={onValueChange}
      />
      {/* 44 px of height to grab on a phone; the thumb itself stays small. */}
      <Slider
        thumbLabel={`${name}, ползунок`}
        className="h-11"
        min={TARE_SLIDER.min}
        max={TARE_SLIDER.max}
        step={TARE_SLIDER.step}
        value={[tareSliderPosition(value)]}
        onValueChange={([position]) => position !== undefined && onValueChange(tareGramsFromSlider(position))}
      />
      <div aria-hidden className="-mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{formatGrams(TARE_SLIDER.min)} г</span>
        <span>{formatGrams(TARE_SLIDER.max)} г</span>
      </div>
    </div>
  )
}
