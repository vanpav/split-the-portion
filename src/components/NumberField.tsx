import { useId, useRef, useState } from 'react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { formatInput, parseGrams } from '@/domain'
import { cn } from '@/lib/utils'

interface NumberFieldProps {
  value: number | null
  onValueChange: (value: number | null) => void
  label?: string
  /** Accessible name when there is no visible label. */
  ariaLabel?: string
  placeholder?: string
  /** Extra rule for a parsed value; a message blocks saving and is shown under the field. */
  validate?: (value: number | null) => string | null
  suffix?: string
  /** Enter pressed (e.g. move to the next row). */
  onEnter?: () => void
  id?: string
  className?: string
  autoFocus?: boolean
  /** «lg» — a big field for add forms (new tare): 56 px high, 18 px text. */
  size?: 'default' | 'lg'
  /** Styles of the box around the input and of the input itself (a field in a dense row). */
  groupClassName?: string
  inputClassName?: string
  /** No message under the field: the red edge alone says it (a row with no room for text). */
  hideError?: boolean
  /** Not a number / failed `validate` — told as typed, so the screen knows before it saves. */
  onInvalidChange?: (invalid: boolean) => void
  /** Leaving the field keeps an invalid text and its red edge instead of falling back to the stored value. */
  keepInvalid?: boolean
  /** Focus selects the number: what is typed replaces it. */
  selectOnFocus?: boolean
  onFocus?: () => void
}

/**
 * Grams input: decimal keyboard, comma or dot, error under the field.
 * While focused it keeps the typed text (even invalid); otherwise it shows the stored value.
 */
export function NumberField({
  value,
  onValueChange,
  label,
  ariaLabel,
  placeholder,
  validate,
  suffix = 'г',
  onEnter,
  id,
  className,
  autoFocus,
  size = 'default',
  groupClassName,
  inputClassName,
  hideError,
  onInvalidChange,
  keepInvalid,
  selectOnFocus,
  onFocus,
}: NumberFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [draft, setDraft] = useState<string | null>(null)
  // The tap that focused the field: its release would put the caret back into the selected number.
  const justFocused = useRef(false)
  // The value changed from outside while focused («Остаток», switching units): show it instead of the typed text.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    const typed = draft === null ? null : parseGrams(draft)
    if (typed && !(typed.ok && typed.value === value)) setDraft(formatInput(value))
  }

  const text = draft ?? formatInput(value)
  const parsed = draft === null ? null : parseGrams(draft)
  const error =
    parsed === null
      ? null
      : !parsed.ok
        ? 'Введи число, например 1240 или 12,5'
        : (validate?.(parsed.value) ?? null)
  const invalid = error !== null

  return (
    <Field className={className} data-invalid={invalid || undefined}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <InputGroup className={cn(size === 'lg' && 'h-14', groupClassName)}>
        <InputGroupInput
          id={inputId}
          type="text"
          inputMode="decimal"
          enterKeyHint="next"
          autoComplete="off"
          autoFocus={autoFocus}
          className={cn(size === 'lg' && 'text-lg md:text-lg', inputClassName)}
          placeholder={placeholder}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={invalid || undefined}
          value={text}
          onFocus={(e) => {
            const input = e.currentTarget
            if (!(keepInvalid && invalid)) setDraft(formatInput(value))
            // After the text switched to the typed form («1 240» → «1240»): selecting earlier would be lost.
            if (selectOnFocus) {
              justFocused.current = true
              requestAnimationFrame(() => input.select())
            }
            onFocus?.()
          }}
          onMouseUp={(e) => {
            if (!justFocused.current) return
            justFocused.current = false
            e.preventDefault()
            e.currentTarget.select()
          }}
          onBlur={() => {
            justFocused.current = false
            if (!(keepInvalid && invalid)) setDraft(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault()
              onEnter()
            }
          }}
          onChange={(e) => {
            setDraft(e.target.value)
            const next = parseGrams(e.target.value)
            const bad = !next.ok || validate?.(next.value) != null
            onInvalidChange?.(bad)
            if (next.ok && !bad) onValueChange(next.value)
          }}
        />
        {suffix && (
          <InputGroupAddon align="inline-end">
            <InputGroupText className={cn(size === 'lg' && 'text-base')}>{suffix}</InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
      {error && !hideError && <FieldError>{error}</FieldError>}
    </Field>
  )
}
