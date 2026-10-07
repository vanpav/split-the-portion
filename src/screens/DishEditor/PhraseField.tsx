import { ClipboardPasteIcon, CookingPotIcon, MicIcon, SquareIcon } from 'lucide-react'
import type { MouseEvent, Ref } from 'react'
import { Link, type To } from 'react-router'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export const PHRASE_FIELD_ID = 'dish-phrase'

interface PhraseFieldProps {
  text: string
  onTextChange: (text: string) => void
  /** The caret moved; null — the field is left. */
  onCaret: (caret: number | null) => void
  onLeave: () => void
  fieldRef: Ref<HTMLTextAreaElement>
  /** «Вставить»; none where the clipboard cannot be read. */
  onPaste: (() => void) | null
  /** «Из блюда»: the screen «Из простого блюда» over the form. */
  fromDishTo: To
  onFromDish: () => void
  /** The mic; null where the browser has no speech recognition. */
  voice: { listening: boolean; transcript: string; onMic: () => void } | null
  /** What was said last, until the field is edited. */
  said: string | null
}

/** Buttons beside the field keep the caret and the keyboard in it. */
const keepFocus = (e: MouseEvent) => e.preventDefault()

/**
 * «Что в блюде» (docs/UX.md §3): one text field for the products, «Вставить» and «Из блюда» above it,
 * the mic in its bottom-right corner; under it a hint, «Слушаю…» while recording, or what was said.
 */
export function PhraseField({ text, onTextChange, onCaret, onLeave, fieldRef, onPaste, fromDishTo, onFromDish, voice, said }: PhraseFieldProps) {
  const caretOf = (el: HTMLTextAreaElement) => onCaret(el.selectionEnd)
  const listening = voice?.listening ?? false

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <label htmlFor={PHRASE_FIELD_ID} className="flex-1 text-sm font-medium">
          Что в блюде
        </label>
        {onPaste && (
          <Button variant="ghost" size="sm" className="h-11 px-2" onMouseDown={keepFocus} onClick={onPaste}>
            <ClipboardPasteIcon data-icon="inline-start" />
            Вставить
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-11 px-2" asChild>
          <Link to={fromDishTo} onClick={onFromDish}>
            <CookingPotIcon data-icon="inline-start" />
            Из блюда
          </Link>
        </Button>
      </div>
      <div className="relative">
        <Textarea
          id={PHRASE_FIELD_ID}
          ref={fieldRef}
          aria-describedby={`${PHRASE_FIELD_ID}-hint`}
          placeholder="Гречка 200"
          autoCapitalize="sentences"
          enterKeyHint="enter"
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value)
            caretOf(e.target)
          }}
          onSelect={(e) => caretOf(e.currentTarget)}
          onFocus={(e) => caretOf(e.currentTarget)}
          onBlur={() => {
            onCaret(null)
            onLeave()
          }}
          className={cn(
            'min-h-24 py-2.5 text-base md:text-base',
            voice && 'pr-14',
            listening && 'border-primary ring-3 ring-primary/30 focus-visible:border-primary focus-visible:ring-primary/30',
          )}
        />
        {voice && (
          <Button
            size="icon"
            variant={listening ? 'default' : 'secondary'}
            aria-label={listening ? 'Остановить' : 'Сказать голосом'}
            aria-pressed={listening}
            onMouseDown={keepFocus}
            onClick={voice.onMic}
            className={cn(
              // 40 px to look at, 44 px to tap.
              'absolute right-1.5 bottom-1.5 size-10 rounded-full after:absolute after:-inset-0.5',
              listening && 'motion-safe:animate-pulse',
            )}
          >
            {listening ? <SquareIcon className="fill-current" /> : <MicIcon />}
          </Button>
        )}
      </div>
      <div id={`${PHRASE_FIELD_ID}-hint`} aria-live="polite" className="px-1 text-sm text-muted-foreground">
        {listening ? (
          <p>
            <span className="text-primary">●</span> Слушаю… <span className="text-foreground">{voice?.transcript}</span>
          </p>
        ) : said !== null ? (
          <p className="line-clamp-2">Сказали: «{said}»</p>
        ) : (
          <p>{voice ? 'Продукт и вес — через запятую, с новой строки или голосом.' : 'Продукт и вес — через запятую или с новой строки.'}</p>
        )}
      </div>
    </div>
  )
}
