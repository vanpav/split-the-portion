import { ChevronDownIcon, ClipboardPasteIcon, CookingPotIcon, MicIcon, SquareIcon } from 'lucide-react'
import type { MouseEvent, Ref } from 'react'
import { Link, type To } from 'react-router'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  /** What was said last and the phrases thrown away, until the field is edited. */
  said: { text: string; skipped: string[] } | null
  /** Folded: only the header row stays, the parse list moves up. */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

/** Buttons beside the field keep the caret and the keyboard in it. */
const keepFocus = (e: MouseEvent) => e.preventDefault()

/**
 * «Что в блюде» (docs/UX.md §3): one text field for the products, «Вставить» and «Из блюда» above it,
 * the mic in its bottom-right corner; under it a hint, «Слушаю…» while recording, or what was said.
 * The title folds the field away (the header row stays), so the parse list is at hand.
 */
export function PhraseField({
  text,
  onTextChange,
  onCaret,
  onLeave,
  fieldRef,
  onPaste,
  fromDishTo,
  onFromDish,
  voice,
  said,
  expanded,
  onExpandedChange,
}: PhraseFieldProps) {
  const caretOf = (el: HTMLTextAreaElement) => onCaret(el.selectionEnd)
  const listening = voice?.listening ?? false

  return (
    <Collapsible open={expanded} onOpenChange={onExpandedChange} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="group/fold -ml-2 h-11 px-2 text-sm font-medium">
              Что в блюде
              <ChevronDownIcon
                data-icon="inline-end"
                className="text-muted-foreground transition-transform group-data-[state=closed]/fold:-rotate-90 motion-reduce:transition-none"
              />
            </Button>
          </CollapsibleTrigger>
        </div>
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
      {/* Kept mounted when folded (`hidden`): the caret and the height logic find the field as it was. */}
      <CollapsibleContent forceMount hidden={!expanded} className="flex flex-col gap-1.5">
        <div className="relative">
          <Textarea
            id={PHRASE_FIELD_ID}
            aria-label="Что в блюде"
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
            <>
              <p className="line-clamp-2">Услышано: «{said.text}»</p>
              {said.skipped.length > 0 && (
                <p className="truncate">Пропущено: {said.skipped.map((phrase) => `«${phrase}»`).join(', ')}</p>
              )}
            </>
          ) : (
            <p>{voice ? 'Ингредиент и вес — через запятую, с новой строки или голосом.' : 'Ингредиент и вес — через запятую или с новой строки.'}</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
