import { SoupIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useOutlet, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { OverScreen } from '@/app/OverScreen'
import { DISHES_PATH, dishPath, FROM_SIMPLE_DISH, NEW_TARE, newDishPath } from '@/app/paths'
import { useReturnAnimation } from '@/app/screenAnimation'
import { CategorySheet } from '@/screens/DishEditor/CategorySheet'
import { BottomBar } from '@/components/BottomBar'
import { DishCategoryIcon } from '@/components/DishCategoryIcon'
import { MoreMenu, type MoreMenuItem } from '@/components/MoreMenu'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  appendToPhrase,
  DEFAULT_PHRASE_LANGUAGE,
  detectCategory,
  DISH_CATEGORIES,
  dishKind,
  dishSource,
  excludedOverrides,
  hasPhraseErrors,
  ingredientsToPhrase,
  liveTareId,
  looksSpoken,
  parsePhrase,
  phraseIngredients,
  phraseIssueText,
  phraseKey,
  phraseSummary,
  phraseSummaryText,
  removePhraseItem,
  spokenToPhrase,
  type DishCategory,
  type ExcludedOverrides,
  type Id,
  type PhraseItem,
} from '@/domain'
import { useSpeechRecognition, type SpeechError } from '@/lib/useSpeechRecognition'
import { cn } from '@/lib/utils'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'
import { DeleteDishDialog } from './DeleteDishDialog'
import type { EditorOutlet } from './editorOutlet'
import { PhraseField } from './PhraseField'
import { PhraseList } from './PhraseList'
import { TareChips } from './TareChips'
import { currentLanguage, t } from '@/i18n'
import { categoryLabel, dishTitle } from '@/i18n/format'

const speechErrorText = (error: SpeechError) => t(`editor.speech.${error}`)

/** The select's value for «По названию» (null in the dish). */
const AUTO_CATEGORY = 'auto'

const canPaste = typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function'

/** What was said by the mic: under the field until it is edited. */
interface Said {
  text: string
  /** Phrases that are not products, thrown away. */
  skipped: string[]
}

/** Where the caret goes after the text is changed by a button: a position, or the end. */
type CaretTarget = number | 'end'

/**
 * Create or edit a dish (recipe), variant «Одной строкой» (docs/UX.md §3 «Редактор блюда»): the name,
 * «Что в блюде» as one phrase with its parse list, the tare. The kind follows the products. Nothing is
 * saved until «Создать» / «Сохранить». `/d/new[?from=<simple dish>|?text=<first words>]` or `/d/:id/edit`; the draft is
 * taken from the route once, on mount.
 */
export function DishEditorForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  // «←» goes back where the form was opened from; by a direct link — to the dish or the list.
  const backTo = id ? dishPath(id) : DISHES_PATH
  const dishes = useAppStore((s) => s.dishes)
  const tares = useAppStore((s) => s.tares)
  const saveDish = useAppStore((s) => s.saveDish)
  const existing = id ? dishes.find((d) => d.id === id) : undefined

  // The phrase is the form's state; the dish keeps ingredients (docs/SPEC.md §7а).
  const [initial] = useState(() => {
    if (existing) {
      return {
        name: existing.name,
        category: existing.category,
        tareId: existing.tareId,
        text: ingredientsToPhrase(existing.ingredients),
        overrides: excludedOverrides(existing.ingredients),
      }
    }
    const base = dishes.find((d) => d.id === params.get('from'))
    const source = base && dishSource(base)
    return {
      name: '',
      category: null,
      // Not everyone weighs in a pot: a new dish starts without tare.
      tareId: null,
      // `?from=` — a simple dish to start with; `?text=` — what was typed in the search («Создать «…»»).
      text: source ? `${ingredientsToPhrase([source])}, ` : (params.get('text') ?? ''),
      overrides: {},
    }
  })
  const [name, setName] = useState(initial.name)
  // null — «по названию»: detected from the title, never stored.
  const [category, setCategory] = useState<DishCategory | null>(initial.category)
  const [tareId, setTareId] = useState<Id | null>(initial.tareId)
  const [text, setText] = useState(initial.text)
  const [overrides, setOverrides] = useState<ExcludedOverrides>(initial.overrides)
  const [caret, setCaret] = useState<number | null>(null)
  // «Сказали: «…»» (and «Пропустил: …») under the field, until it is edited.
  const [said, setSaid] = useState<Said | null>(null)
  // «Что в блюде» folded: the parse list moves up to work with. Per visit, not stored.
  const [expanded, setExpanded] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const addTareRef = useRef<HTMLAnchorElement>(null)
  const nextCaret = useRef<CaretTarget | null>('end')
  // The control focused again once a screen over the form is gone: the one it was opened from.
  const refocus = useRef<'phrase' | 'tare' | null>(null)
  // A text whose normalization was undone: it stays as typed when the field is left again.
  const keptAsTyped = useRef<string | null>(null)

  const items = useMemo(() => parsePhrase(text, { excluded: overrides }), [text, overrides])

  /** The phrase changed by a button, not by typing: the caret goes where it is told. */
  const replaceText = (next: string, caretTo: CaretTarget) => {
    nextCaret.current = caretTo
    setText(next)
    setSaid(null)
  }
  const undoable = (message: string, before: string, onUndo?: () => void) =>
    toast(message, {
      duration: 5000,
      action: {
        label: t('common.undo'),
        onClick: () => {
          onUndo?.()
          replaceText(before, 'end')
        },
      },
    })

  // The field grows with its text by `field-sizing: content`; a browser without it (older iOS Safari)
  // gets the height set here, so the phrase is never a scroll box inside the form.
  useLayoutEffect(() => {
    const field = fieldRef.current
    if (!field || CSS.supports('field-sizing', 'content') || field.closest('[hidden]')) return
    field.style.height = 'auto'
    field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`
  }, [text, expanded])

  // The caret on open (at the end), and after a button changed the text.
  useLayoutEffect(() => {
    const field = fieldRef.current
    const target = nextCaret.current
    if (!field || target === null) return
    nextCaret.current = null
    // Folded, or under a screen over the form: the text changes, the hidden field is not focused.
    if (field.closest('[hidden]')) return
    const at = target === 'end' ? field.value.length : Math.min(target, field.value.length)
    field.focus({ preventScroll: true })
    field.setSelectionRange(at, at)
    // Moving the caret by hand fires no `select` the row highlight would follow.
    setCaret(at)
  }, [text])

  const speech = useSpeechRecognition({
    lang: DEFAULT_PHRASE_LANGUAGE.speechLocale,
    onResult: (spokenText) => {
      const spoken = spokenToPhrase(spokenText)
      const products = spoken.text.trim() !== ''
      if (!products && spoken.skipped.length === 0) {
        toast(speechErrorText('nothingHeard'))
        return
      }
      // Said goes straight into the field; «Сказали» under it shows what was heard.
      if (products) replaceText(appendToPhrase(text, spoken.text), 'end')
      setSaid({ text: spokenText, skipped: spoken.skipped })
    },
    onError: (error) => toast(speechErrorText(error)),
  })

  // «Из простого блюда» and «Новая тара» are screens over the form (docs/UX.md §3а): the form stays
  // mounted under them, hidden, keeping the draft; what was picked comes back through the outlet.
  const outlet = useOutlet({
    onPick: (source) => {
      nextCaret.current = 'end'
      setText((t) => appendToPhrase(t, ingredientsToPhrase([source])))
      setSaid(null)
    },
    onTare: (tare) => setTareId(tare.id),
    backLabel: t('common.dish'),
  } satisfies EditorOutlet)
  const covered = outlet !== null
  const returnAnimation = useReturnAnimation(covered)
  useEffect(() => {
    if (covered || !refocus.current) return
    nextCaret.current = null
    if (refocus.current === 'tare') addTareRef.current?.focus({ preventScroll: true })
    else {
      const field = fieldRef.current
      field?.focus({ preventScroll: true })
      field?.setSelectionRange(field.value.length, field.value.length)
    }
    refocus.current = null
  }, [covered])

  if (id && !existing) return <Navigate to="/" replace />
  const isNew = !existing

  const toggle = (item: PhraseItem) => setOverrides({ ...overrides, [phraseKey(item.name)]: !item.excluded })
  const remove = (index: number) => {
    const item = items[index]
    if (!item) return
    const before = text
    replaceText(removePhraseItem(text, index, { excluded: overrides }), item.start)
    undoable(t('editor.removed', { name: item.name || t('common.untitled') }), before)
  }
  // Dictated with the phone keyboard's mic: brought to «продукт вес» on leaving the field.
  const leave = () => {
    if (!text.trim() || text === keptAsTyped.current || !looksSpoken(text)) return
    const next = spokenToPhrase(text).text
    if (next === text) return
    const before = text
    setText(next)
    undoable(t('editor.normalized'), before, () => (keptAsTyped.current = before))
  }
  const paste = async () => {
    try {
      const clip = (await navigator.clipboard.readText()).trim()
      if (!clip) return
      nextCaret.current = 'end'
      setText((t) => appendToPhrase(t, clip))
      setSaid(null)
    } catch {
      // Refused by the browser or the user: nothing to paste.
    }
  }

  const summary = phraseSummary(items)
  const summaryText = summary && phraseSummaryText(summary)
  const firstError = items.flatMap((i) => i.issues).find((issue) => issue.level === 'error')
  const blocked =
    hasPhraseErrors(items) && firstError
      ? t('editor.checkParse', { issue: phraseIssueText(firstError) })
      : items.some((i) => i.name && !i.excluded)
        ? null
        : t('editor.enterIngredient')
  // The name the dish gets when none is typed.
  const titlePlaceholder = dishTitle({
    name: '',
    ingredients: items.map((i) => ({ id: '', name: i.name, rawGrams: i.rawGrams, excluded: i.excluded })),
  })

  // «По названию» follows the name as typed, or the name the dish gets from its products.
  const detected = detectCategory(name.trim() || titlePlaceholder)
  const somethingTyped = name.trim() !== '' || items.some((i) => i.name)

  const save = () => {
    if (blocked) return
    const ingredients = phraseIngredients(items, existing?.ingredients ?? []).map((i) => ({ ...i, id: i.id ?? newId() }))
    const savedId = saveDish({ ...existing, kind: dishKind(ingredients), name: name.trim(), category, tareId, ingredients })
    navigate(dishPath(savedId), { replace: true })
  }

  const menu: MoreMenuItem[] = existing
    ? [
        ...(existing.kind === 'simple' ? [{ label: t('editor.makeComposite'), to: newDishPath(existing.id), icon: SoupIcon }] : []),
        { label: t('editor.deleteDish'), icon: Trash2Icon, destructive: true, onSelect: () => setDeleting(true) },
      ]
    : []
  // Screens over the form keep its query: `from` is part of its address.
  const search = params.toString() ? `?${params.toString()}` : ''

  return (
    <>
      <div hidden={covered} className={cn('flex flex-1 flex-col', returnAnimation)}>
        <ScreenHeader
          title={t(isNew ? 'editor.addTitle' : 'editor.editTitle')}
          back
          backTo={backTo}
          backLabel={t(existing ? 'common.calculator' : 'common.dishes')}
          action={<MoreMenu items={menu} />}
        />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between px-1">
                <label htmlFor="dish-name" className="text-sm font-medium">
                  {t('editor.name')}
                </label>
                <span className="text-sm text-muted-foreground">{t('editor.nameOptional')}</span>
              </div>
              <Input
                id="dish-name"
                className="h-12 text-xl md:text-xl"
                placeholder={titlePlaceholder}
                enterKeyHint="next"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  fieldRef.current?.focus()
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label id="dish-category-label" htmlFor="dish-category" className="px-1 text-sm font-medium">
                {t('editor.category')}
              </label>
              <CategorySheet
                id="dish-category-sheet"
                labelId="dish-category-label"
                value={category}
                detected={detected}
                onChange={setCategory}
                className="md:hidden"
              />
              <div className="hidden md:block">
                <Select value={category ?? AUTO_CATEGORY} onValueChange={(v) => setCategory(v === AUTO_CATEGORY ? null : (v as DishCategory))}>
                  <SelectTrigger id="dish-category" aria-labelledby="dish-category-label" className="w-full">
                    <span className="flex min-w-0 flex-1 justify-start">
                      <SelectValue>
                        <span className="flex min-w-0 items-center gap-2">
                          <DishCategoryIcon category={category ?? detected} className="size-4" />
                          <span className="truncate">{categoryLabel(category ?? detected)}</span>
                        </span>
                      </SelectValue>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{t(category ? 'editor.categoryManual' : 'editor.categoryAuto')}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_CATEGORY}>
                      <DishCategoryIcon category={detected} className="size-4 text-muted-foreground" />
                      <span>
                        {t('editor.categoryAutoItem')} <span className="text-muted-foreground">· {categoryLabel(detected)}</span>
                      </span>
                    </SelectItem>
                    <SelectSeparator />
                    {DISH_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        <DishCategoryIcon category={c} className="size-4 text-muted-foreground" />
                        <span>{categoryLabel(c)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!category && detected === 'other' && somethingTyped && (
                <p className="px-1 text-sm text-muted-foreground">{t('editor.categoryUnknown')}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <PhraseField
              text={text}
              onTextChange={(next) => {
                setText(next)
                setSaid(null)
              }}
              onCaret={setCaret}
              onLeave={leave}
              fieldRef={fieldRef}
              onPaste={canPaste ? () => void paste() : null}
              fromDishTo={{ pathname: FROM_SIMPLE_DISH, search }}
              onFromDish={() => (refocus.current = 'phrase')}
              voice={
                // The phrase speaks Russian only for now: in another UI language the mic would hear the wrong one.
                speech.supported && currentLanguage() === DEFAULT_PHRASE_LANGUAGE.locale
                  ? {
                      listening: speech.listening,
                      transcript: speech.transcript,
                      onMic: speech.listening ? speech.stop : speech.start,
                    }
                  : null
              }
              said={said}
              expanded={expanded}
              onExpandedChange={(open) => {
                // Folding hides the mic: recording stops with it.
                if (!open && speech.listening) speech.stop()
                setExpanded(open)
              }}
            />
            <PhraseList items={items} caret={expanded ? caret : null} onToggle={toggle} onRemove={remove} />
            {summaryText && (
              <p className="px-1 text-sm text-muted-foreground" aria-live="polite">
                <span className="font-semibold text-foreground">{summaryText.kind}</span> · {summaryText.details}
              </p>
            )}
          </div>

          <section className="flex flex-col gap-1.5">
            <h2 id="dish-tare-title" className="px-1 text-sm font-medium">
              {t('editor.tareTitle')}
            </h2>
            <TareChips
              tares={tares}
              tareId={liveTareId(tareId, tares)}
              onChange={setTareId}
              addTo={{ pathname: NEW_TARE, search }}
              addRef={addTareRef}
              onAdd={() => (refocus.current = 'tare')}
            />
          </section>

          <BottomBar>
            <div className="flex flex-1 flex-col gap-2">
              {blocked && <p className="text-sm text-muted-foreground">{blocked}</p>}
              <Button size="lg" className="w-full lg:w-auto lg:self-start" disabled={blocked !== null} onClick={save}>
                {t(isNew ? 'editor.create' : 'editor.save')}
              </Button>
            </div>
          </BottomBar>
        </main>
      </div>
      {existing && <DeleteDishDialog dish={existing} open={deleting} onOpenChange={setDeleting} />}
      {outlet && <OverScreen>{outlet}</OverScreen>}
    </>
  )
}
