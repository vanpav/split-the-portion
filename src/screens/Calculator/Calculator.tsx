import { Undo2Icon } from 'lucide-react'
import { useEffect, useEffectEvent, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Navigate, useNavigate, useOutlet } from 'react-router'
import { toast } from 'sonner'
import { OverScreen } from '@/app/OverScreen'
import { ingredientsPath, newCompanyPath, newTarePath } from '@/app/paths'
import { useReturnAnimation } from '@/app/screenAnimation'
import { AddPersonRow } from '@/components/AddPersonRow'
import { ShareSlider, type DishSegment } from '@/components/ShareSlider'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  addPortion,
  companyLineup,
  computeCooking,
  cookedToday,
  cookingDraft,
  defaultShareWeight,
  dishLineup,
  dishPortions,
  exactPercents,
  keypadText,
  keepLimit,
  lineupCompany,
  lineupPercents,
  liveTareId,
  matchingCompany,
  parseGrams,
  portionGrams,
  portionIn,
  portionRawGrams,
  RAW_SUM,
  rawTile,
  recipeInOneColumn,
  removeLastPortion,
  splitAmounts,
  splitSummary,
  tileRows,
  typedGrams,
  type Company,
  type CompanyMember,
  type Dish,
  type Id,
  type SplitMode,
} from '@/domain'
import { ADD_PERSON_ID, calculatorFieldId, COMPANY_SELECT_ID, focusOrBlur, INGREDIENTS_KNOB_ID, TARE_SELECT_ID } from '@/lib/domIds'
import { cn } from '@/lib/utils'
import { useCalculatorTour } from '@/onboarding/useCalculatorTour'
import { newId } from '@/store/id'
import { usePrefsStore } from '@/store/prefs'
import { endLaunch, launchInput, useLastCalculatorStore, type OwnPortion as Own } from '@/store/lastCalculator'
import { useAppStore } from '@/store/store'
import type { CalculatorOutlet } from './calculatorOutlet'
import { CompanyPicker } from './CompanyPicker'
import { DisplayRow } from './DisplayRow'
import { portionName, rawTileLines, rawWord } from './messages'
import { KHint } from './KHint'
import { PersonResult } from './PersonResult'
import { PortionStepper } from './PortionStepper'
import { PortionSummary } from './PortionSummary'
import { PortionTile } from './PortionTile'
import { RawTile } from './RawTile'
import { TareSelect } from './TareSelect'
import { t } from '@/i18n'
import { clockTime, dishTitle, formatGrams, gramsText, ingredientDisplayName, lineupName } from '@/i18n/format'

/** Row id of the weight after cooking; the other rows are ingredient ids. */
const COOKED = 'cooked'
// Six-column grid: a row of three tiles spans 2 each, of two spans 3, a lone one spans 6.
const TILE_SPAN: Record<number, string> = { 1: 'col-span-6', 2: 'col-span-3', 3: 'col-span-2' }
/** A person's own portion (cooked grams) is a field too. */
const personKey = (personId: string) => `person:${personId}`
const personTarget = (row: string) => (row.startsWith('person:') ? row.slice('person:'.length) : null)

const ownCooked = (fixed: Record<string, Own>) =>
  Object.fromEntries(Object.entries(fixed).flatMap(([id, own]) => (!own.raw ? [[id, own.value]] : [])))
const ownRaw = (fixed: Record<string, Own>) =>
  Object.fromEntries(
    Object.entries(fixed).flatMap(([id, own]) => (own.raw ? [[id, { ingredientId: own.raw, grams: own.value }]] : [])),
  )

const toNumber = (text: string) => {
  const parsed = parseGrams(text)
  return parsed.ok ? parsed.value : null
}

/**
 * Opening a dish: a calculator, like a unit converter (docs/SPEC.md §3б). The dish is a preset that
 * remembers what is typed — the raw weight, the tare, who eats and in what parts — so usually only
 * the cooked weight is new. Each person's portion updates on every key; nothing to save.
 * Mounted per dish (see CalculatorScreen).
 */
export function Calculator({ id }: { id: Id | undefined }) {
  const dish = useAppStore((s) => s.dishes.find((d) => d.id === id))
  const tares = useAppStore((s) => s.tares)
  const companies = useAppStore((s) => s.companies)
  const saveDish = useAppStore((s) => s.saveDish)
  const lineups = useAppStore((s) => s.lineups)
  const setLineup = useAppStore((s) => s.setLineup)
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  const setCooked = useAppStore((s) => s.setCooked)
  // «Доли» (docs/SPEC.md §3б): this device's choice for every dish; the portions are per dish, here only.
  const splitMode = usePrefsStore((s) => s.splitMode)
  const setSplitMode = usePrefsStore((s) => s.setSplitMode)
  const storedPortions = usePrefsStore((s) => (id ? s.portions[id] : undefined))
  const setPortions = usePrefsStore((s) => s.setPortions)
  // «Состав»: the recipe of every portion, on or off for all dishes of this device.
  const composition = usePrefsStore((s) => s.composition)
  const setComposition = usePrefsStore((s) => s.setComposition)
  const inShares = splitMode === 'shares'
  const [now] = useState(() => new Date().toISOString())
  // After a restart or a crash the first calculator comes back as it was left today (store/lastCalculator).
  const [restored] = useState(() => launchInput(id, new Date(now)))
  const rememberLast = useLastCalculatorStore((s) => s.remember)

  // Raw weights come from the dish (what was typed last time).
  const [texts, setTexts] = useState<Record<string, string>>(
    () => restored?.texts ?? Object.fromEntries((dish?.ingredients ?? []).map((i) => [i.id, keypadText(i.rawGrams)])),
  )
  // «Готовый» is today's weighing of this dish, here or on another device of the group; once typed into
  // here, it is what is typed.
  const [cookedTouched, setCookedTouched] = useState(restored?.cookedTouched ?? false)
  // The dish remembers the tare it is weighed in, as it does the raw weight. A tare deleted from the
  // library is no tare: weighed without it (docs/SPEC.md §8).
  const tareId = liveTareId(dish?.tareId ?? null, tares)
  const tare = tares.find((t) => t.id === tareId) ?? null
  const cookedHere = useMemo(() => (dish ? cookedToday(dish.cooked, tareId, new Date(now)) : null), [dish, tareId, now])
  const textOf = (row: string) => (row === COOKED && !cookedTouched ? keypadText(cookedHere) : (texts[row] ?? ''))
  const cookedText = textOf(COOKED)
  // A simple dish shows its product only: water or salt «не учитывать» do not change the portions.
  const shownIngredients = (dish?.ingredients ?? []).filter((i) => dish?.kind !== 'simple' || !i.excluded)
  // A composite dish has «Сырой | Готовый»: the raw weight of what counts as one tile, the ingredients
  // themselves on a screen of their own. Counted ones: «Состав» shows what a portion is made of.
  const composite = shownIngredients.length > 1
  const countedShown = shownIngredients.filter((i) => !i.excluded)
  const recipeAvailable = countedShown.length > 1
  const rows = composite ? [COOKED] : [...shownIngredients.map((i) => i.id), COOKED]
  // Start where the number is missing: usually the weight after cooking. With a mouse that field is
  // focused at once; on a phone the system keyboard waits for a tap, so it does not cover the answer.
  const [start] = useState(() =>
    window.matchMedia('(pointer: fine)').matches ? (rows.find((r) => r !== COOKED && !texts[r]) ?? COOKED) : null,
  )
  // The field that has focus, if any.
  const [active, setActive] = useState<string | null>(null)
  // The weight field last in focus: «Сухой» shows the portions in dry grams, «Готовый» in cooked
  // (docs/SPEC.md §3б). It stays when a person's field or nothing has focus. The dish opens where the
  // number is missing, as the focus does with a mouse.
  // «Сырой» of a composite dish is no field, so it is a row of its own: RAW_SUM.
  const [weightRow, setWeightRow] = useState(() =>
    restored && (restored.weightRow === RAW_SUM ? composite : rows.includes(restored.weightRow))
      ? restored.weightRow
      : (rows.find((r) => r !== COOKED && !texts[r]) ?? COOKED),
  )
  // Today's own portions, in grams of the view they were typed in: these people get exactly that,
  // the rest split what is left by share. No percent anywhere (docs/SPEC.md §3б).
  const [fixed, setFixed] = useState<Record<Id, Own>>(restored?.fixed ?? {})
  // «На завтра»: percent of the dish set aside, pulled in from the bar's right edge.
  const [keep, setKeep] = useState(restored?.keep ?? 0)
  // Every change is written at once: a crash loses nothing typed. Only this calculator, no other screen.
  const dishId = dish?.id
  useEffect(() => {
    if (!dishId) return
    rememberLast({
      dishId,
      at: new Date().toISOString(),
      input: { texts, cookedTouched, weightRow, fixed, keep },
    })
  }, [dishId, rememberLast, texts, cookedTouched, weightRow, fixed, keep])
  useEffect(() => endLaunch(), [])

  // «Кто ест» is remembered per dish; before it is first changed, the first company.
  const lineup = useMemo(() => dishLineup(lineups, id ?? '', companies), [lineups, id, companies])
  // The company picked stays picked however the shares are moved: it is a template, never changed here.
  const company = useMemo(() => lineupCompany(lineup, companies), [lineup, companies])
  const companyId = company?.id ?? null
  const matching = useMemo(() => matchingCompany(lineup.members, companies), [lineup, companies])
  // A dish never split in «Доли» starts with two equal portions; their ids are made once.
  const [freshIds] = useState(() => [newId(), newId()])
  const portions = useMemo(() => dishPortions(storedPortions, freshIds), [storedPortions, freshIds])
  // Who the dish is split between: the people of «Кто ест», or in «Доли» the portions, named by place.
  // Everything below treats both alike.
  const people = useMemo(
    () => (inShares ? portions.map((p, i) => ({ id: p.id, name: portionName(i), weight: p.weight })) : lineup.members),
    [inShares, portions, lineup],
  )
  const setPeople = (members: CompanyMember[]) => {
    if (!dish) return
    // Portions keep no names: they are numbered again after one is taken away.
    if (inShares) setPortions(dish.id, members.map((m) => ({ id: m.id, weight: m.weight })))
    else setLineup(dish.id, { companyId, members })
  }
  const remember = (patch: Partial<Pick<Dish, 'ingredients' | 'tareId' | 'cooked'>>) => {
    if (dish) saveDish({ ...dish, ...patch }, { used: true })
  }
  const base = useMemo(
    () =>
      dish &&
      cookingDraft(
        dish,
        {
          rawGrams: Object.fromEntries(dish.ingredients.map((i) => [i.id, toNumber(texts[i.id] ?? '')])),
          scaleGrams: toNumber(cookedTouched ? (texts[COOKED] ?? '') : keypadText(cookedHere)),
          tare,
          people,
          companyId,
          fixedCooked: ownCooked(fixed),
          fixedRaw: ownRaw(fixed),
        },
        now,
      ),
    [dish, texts, cookedTouched, cookedHere, tare, people, companyId, fixed, now],
  )
  // «На завтра» is cut from what the sharing people hold: with nothing set aside they hold all that is free.
  // Own portions typed later may leave less, so the cut is held to what is possible now. «Доли» have no
  // «На завтра»: what was set aside for people does not touch the portions.
  const keepMost = useMemo(() => {
    const phase = !inShares && base && computeCooking(base).phases[0]
    return phase ? keepLimit(phase, people.filter((p) => fixed[p.id] === undefined).map((p) => p.id)) : 0
  }, [inShares, base, people, fixed])
  const keepNow = Math.min(keep, keepMost)
  const draft = useMemo(() => base && (keepNow > 0 ? { ...base, keepPercent: keepNow } : base), [base, keepNow])
  const result = useMemo(() => (draft ? computeCooking(draft) : undefined), [draft])
  const phase = result?.phases[0]
  // The raw view: «Сухой» — the one counted ingredient, «Сырой» of a composite dish — all counted ones together.
  const rawOf = result && (composite ? weightRow === RAW_SUM : result.baseIngredientId !== null && weightRow === result.baseIngredientId) ? weightRow : null

  // Own portions are remembered as each person's part of the dish: next time the same parts, by share.
  // Once typed, not on every key: a number typed and erased would leave its person with a sliver.
  const rememberOwn = useEffectEvent(() => {
    if (!dish || !phase || Object.keys(fixed).length === 0) return
    const next = lineupPercents(people, phase.portions)
    if (next && next.some((p, i) => p.weight !== people[i]?.weight)) setPeople(next)
  })
  const typingOwn = active !== null && personTarget(active) !== null
  useEffect(() => {
    if (!typingOwn) rememberOwn()
  }, [typingOwn, fixed, phase])
  // Leaving the dish while still typing an own portion.
  useEffect(() => () => rememberOwn(), [])

  const type = (row: string, typed: string) => {
    // Kept to a weight, as the keys allowed: digits, one comma, 99 999,9 at most.
    const next = typedGrams(typed)
    setTexts((t) => ({ ...t, [row]: next }))
    const grams = toNumber(next)
    // The cooked weight goes into the dish with the time: the group sees today's weighing.
    if (dish && row === COOKED) {
      setCookedTouched(true)
      setCooked(dish.id, grams)
    }
    // A raw weight is the dish's own: typed today, it is there next time.
    const ingredient = dish?.ingredients.find((i) => i.id === row)
    if (dish && ingredient && grams !== null && grams > 0 && grams !== ingredient.rawGrams) {
      remember({ ingredients: dish.ingredients.map((i) => (i.id === row ? { ...i, rawGrams: grams } : i)) })
    }
    // A person's number: a value makes it their own portion, an empty field gives them back to the shares.
    const personId = personTarget(row)
    if (personId) setOwn(personId, grams, rawOf)
  }
  // The weight typed here now means the weight in the new tare. One from elsewhere was weighed in the
  // old tare: it no longer fits and is not shown.
  const changeTare = (next: Id | null) =>
    remember({ tareId: next, cooked: cookedTouched && dish?.cooked ? { ...dish.cooked, tareId: next } : (dish?.cooked ?? null) })
  const leave = () => setActive(null)
  // Leaving a person's field from a button that changes them: what was typed is settled first.
  const leavePerson = (personId: Id) => {
    if (active === personKey(personId)) focusOrBlur(null)
  }
  const setOwn = (personId: Id, value: number | null, raw: Id | null) =>
    setFixed((f) => {
      const { [personId]: _old, ...rest } = f
      if (value === null || value <= 0) return rest
      return { ...rest, [personId]: raw ? { value, raw } : { value } }
    })
  const activatePerson = (personId: Id) => {
    const key = personKey(personId)
    const own = fixed[personId]
    // An own portion typed in the other view (dry ⇄ cooked) is shown in this one.
    const computed = phase?.portions.find((p) => p.portionId === personId)
    const sameView = own && (own.raw ?? null) === rawOf
    const value = !own ? null : sameView ? own.value : computed ? portionIn(computed, 'g', rawOf) : null
    setTexts((t) => ({ ...t, [key]: value !== null ? keypadText(value) : '' }))
    setActive(key)
  }
  // ↓ ↑ walk the weights; from a person they go back to «Готовый». Enter moves on to «Готовый»
  // and there closes the keyboard: the answer is under it.
  const fieldKeys = (row: string) => (e: KeyboardEvent<HTMLInputElement>) => {
    const index = rows.indexOf(row)
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (step !== 0) {
      e.preventDefault()
      focusOrBlur(calculatorFieldId(index === -1 ? COOKED : rows[(index + step + rows.length) % rows.length]))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      focusOrBlur(index !== -1 && index < rows.length - 1 ? calculatorFieldId(rows[index + 1]) : null)
    }
  }
  const weightField = (row: string) => ({
    id: calculatorFieldId(row),
    active: active === row,
    autoFocus: row === start,
    onFocus: () => {
      setActive(row)
      setWeightRow(row)
    },
    onBlur: leave,
    onText: (typed: string) => type(row, typed),
    onKeyDown: fieldKeys(row),
  })

  // People ⇄ «Доли»: today's own portions belong to the ones left; they are already remembered as shares.
  const switchMode = (mode: SplitMode) => {
    if (mode === splitMode) return
    if (active !== null && personTarget(active)) focusOrBlur(null)
    setFixed({})
    setSplitMode(mode)
  }
  // A company brings its default shares; what was moved for this dish before is replaced. From «Доли»
  // the dish's own company goes back to its people as they were.
  const choosePreset = (preset: Company) => {
    if (!dish) return
    if (inShares) {
      switchMode('people')
      if (preset.id === companyId) return
    }
    setLineup(dish.id, companyLineup(preset))
  }
  // «−» / «+» right of the bar: one portion more with the average share, or the last one away.
  const morePortions = () => {
    if (dish) setPortions(dish.id, addPortion(portions, newId()))
  }
  const fewerPortions = () => {
    const last = portions.at(-1)
    if (!dish || !last || portions.length <= 1) return
    setPortions(dish.id, removeLastPortion(portions))
    setFixed(({ [last.id]: _removed, ...rest }) => rest)
    leavePerson(last.id)
  }

  // «Новая тара» and «Новая компания» are screens over the calculator (docs/UX.md §3а): it stays
  // mounted under them, hidden, keeping what is typed today; a result comes back through the outlet.
  const navigate = useNavigate()
  // «Сырой» of a composite dish: the weights as typed, summed, with a note of what is not counted.
  const raw = rawTile(shownIngredients.map((i) => ({ ...i, rawGrams: toNumber(texts[i.id] ?? '') })))
  // The field focused again once the screen is gone: the one it was opened from, or «+ Имя» after a new company.
  const refocus = useRef<string | null>(null)
  const outlet = useOutlet({
    dishId: id ?? '',
    onTare: (picked) => changeTare(picked.id),
    backLabel: t('common.calculator'),
    ingredients: { dishName: dish ? dishTitle(dish) : '', list: shownIngredients, texts, total: raw.total, onText: type },
    onCompany: (added) => {
      choosePreset(added)
      refocus.current = ADD_PERSON_ID
    },
  } satisfies CalculatorOutlet)
  const covered = outlet !== null
  const returnAnimation = useReturnAnimation(covered)
  const openScreen = (path: string, from: string) => {
    refocus.current = from
    navigate(path)
  }
  useEffect(() => {
    if (covered || !refocus.current) return
    // The scroll is restored by the router: the field is where it was.
    document.getElementById(refocus.current)?.focus({ preventScroll: true })
    refocus.current = null
  }, [covered])
  // The raw view is chosen by the tile; coming back from the ingredients leaves it so.
  const selectRaw = () => {
    if (active !== null) focusOrBlur(null)
    setWeightRow(RAW_SUM)
  }
  const openIngredients = () => {
    selectRaw()
    if (dish) openScreen(ingredientsPath(dish.id), INGREDIENTS_KNOB_ID)
  }
  const addPerson = (name: string) => {
    const person: CompanyMember = { id: newId(), name, weight: defaultShareWeight(people.map((p) => p.weight)) }
    setPeople([...people, person])
  }
  const updatePerson = (personId: Id, name: string) =>
    setPeople(people.map((p) => (p.id === personId ? { ...p, name } : p)))
  // A person out of today's lineup (a portion in «Доли» goes with «−»: portions are numbered by place).
  const removePerson = (personId: Id) => {
    if (!dish) return
    const own = fixed[personId]
    const name = people.find((p) => p.id === personId)?.name.trim()
    setPeople(people.filter((p) => p.id !== personId))
    setFixed(({ [personId]: _removed, ...rest }) => rest)
    leavePerson(personId)
    // A swipe can remove by accident: the toast brings the person back with their share.
    toast(name ? t('editor.removed', { name }) : t('calculator.personRemoved'), {
      duration: 5000,
      action: {
        label: t('common.undo'),
        onClick: () => {
          setLineup(dish.id, lineup)
          // Today's own portion only while the same list is shown: switching clears them.
          if (own && usePrefsStore.getState().splitMode === splitMode) setFixed((f) => ({ ...f, [personId]: own }))
        },
      },
    })
  }
  // The slider splits what is left after own portions: it only shows the people who share.
  const sharing = people.filter((p) => fixed[p.id] === undefined)
  // Who − and + adjust: tapped on the bar, in a row or in a container; the first one who shares until then.
  const [chosen, setChosen] = useState<Id | null>(null)
  const chosenId = sharing.find((p) => p.id === chosen)?.id ?? sharing[0]?.id ?? null
  // The share slider works in whole percents: shares become them.
  const setPercents = (percents: number[]) =>
    setPeople(
      people.map((p) => {
        const index = sharing.findIndex((x) => x.id === p.id)
        return index === -1 ? p : { ...p, weight: percents[index] ?? p.weight }
      }),
    )
  // Back to shares. One person keeps their old share; «Сбросить свои» keeps today's split as it is.
  const releaseOwn = (personId: Id) => {
    setFixed(({ [personId]: _released, ...rest }) => rest)
    leavePerson(personId)
  }
  const allToShares = () => {
    const shares = people.map((p) => Math.max(phase?.portions.find((x) => x.portionId === p.id)?.share ?? 0, 0))
    if (shares.some((x) => x > 0)) {
      const percents = exactPercents(shares)
      setPeople(people.map((p, i) => ({ ...p, weight: percents[i] })))
    }
    setFixed({})
    if (active !== null && personTarget(active)) focusOrBlur(null)
  }
  const saveAsCompany = () => {
    const saved = upsertCompany({ name: lineupName(people) || t('common.company.default'), members: people.map((p) => ({ ...p })) })
    if (dish) setLineup(dish.id, { companyId: saved, members: people })
    toast(t('calculator.companySaved'), { description: lineupName(people) })
  }

  // A person's or a portion's amount as a field: tap it and type their own portion.
  const amountField = (personId: Id) => ({
    id: calculatorFieldId(personKey(personId)),
    active: active === personKey(personId),
    text: texts[personKey(personId)] ?? '',
    own: fixed[personId] !== undefined,
    onFocus: () => activatePerson(personId),
    onBlur: leave,
    onText: (typed: string) => type(personKey(personId), typed),
    onKeyDown: fieldKeys(personKey(personId)),
  })
  const gramsLabel = (grams: number | null) => (grams !== null ? gramsText(grams) : null)
  // A person's place in today's lineup: their lid color on the bar and in their row.
  const placeOf = (personId: Id) => Math.max(people.findIndex((x) => x.id === personId), 0)
  // Each person's part of the whole dish, for the bar.
  const segments: DishSegment[] = (phase?.portions ?? []).map((p) => ({
    id: p.portionId,
    place: placeOf(p.portionId),
    name: people.find((x) => x.id === p.portionId)?.name ?? '',
    share: Math.max(p.share ?? 0, 0),
    label: gramsLabel(portionGrams(p, rawOf)),
  }))
  const potRaw = result && phase ? portionRawGrams(result, phase.remainder.raw) : null
  // «Доли»: the portions that split by share all get the same — one ⧉ above the grid copies any of them.
  // The same test as that line's, so the tiles hide their ⧉ before the dish is weighed too (then by shares, unseen).
  const sharingAmounts = splitAmounts((phase?.portions ?? []).filter((p) => fixed[p.portionId] === undefined), rawOf, 'g')
  const sameShares = splitSummary(sharingAmounts.values, sharingAmounts.inPercent ? 1 : 0)?.same != null
  // The portions that share are equal and weighed: their containers are numbers only, the grams are said once
  // above them. An own portion keeps its grams (and recipe) in a container across the whole row.
  const compactTiles = sameShares && !sharingAmounts.inPercent
  // The tour over this screen (docs/UX.md §3б): with the share bar on screen its third step points at it.
  useCalculatorTour({ paused: covered, composite: dish?.kind === 'composite', people: segments.some((x) => x.share > 0) })

  if (!dish || !draft || !result || !phase) return <Navigate to="/" replace />
  const simple = dish.kind === 'simple'
  // «Состав»: shown for a dish with several counted ingredients; names too long for half a column put the
  // whole recipe in one column.
  const recipeOpen = recipeAvailable && composition
  const oneColumn = recipeInOneColumn(countedShown.map((i) => ingredientDisplayName(i)))
  const recipe = recipeAvailable ? { open: recipeOpen, oneColumn } : undefined
  // «Доли» tiles: as usual with the mode off. On, a tile with a recipe needs width: unequal portions go two
  // to a row; with equal ones the recipe sits once under the summary, only an own portion's tile has its own
  // and takes the row, the others keep the rows of the portions that share.
  // The containers: the portions that share first, own ones after them — as on the bar. Numbers stay by place.
  const gridPortions = [
    ...phase.portions.filter((p) => fixed[p.portionId] === undefined),
    ...phase.portions.filter((p) => fixed[p.portionId] !== undefined),
  ]
  const sharingCount = phase.portions.filter((p) => fixed[p.portionId] === undefined).length
  const spansOf = (count: number) => tileRows(count).flatMap((n) => Array<number>(n).fill(n)).map((n) => TILE_SPAN[n])
  const tileSpans = (() => {
    if (!recipeOpen) return spansOf(gridPortions.length)
    if (!sameShares) return gridPortions.map(() => 'col-span-3')
    const sharingSpans = spansOf(sharingCount)
    let next = 0
    return gridPortions.map((p) => (fixed[p.portionId] !== undefined ? 'col-span-6' : sharingSpans[next++]))
  })()

  // Under the readouts, after the tare: the weight without it and k.
  const tareNote = tare && phase.foodGrams !== null ? t('calculator.foodGrams', { grams: formatGrams(phase.foodGrams) }) : null
  const note = tareNote !== null || phase.k !== null
  const tareExceeds = phase.weighingError === 'tareExceeds'

  return (
    <>
      <main
        hidden={covered}
        className={cn(
          'mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-3 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-2xl',
          returnAnimation,
        )}
      >
        <section aria-label={t('calculator.weight')} className="flex flex-col gap-1">
          {/* «Сухой | Готовый» side by side for one product, «Сырой | Готовый» for a composite dish: the layout
              never changes, the ingredients are on a screen of their own. */}
          <div data-hint="tiles" className="grid grid-cols-2 gap-2">
            {composite ? (
              <RawTile
                total={raw.total}
                lines={rawTileLines(raw)}
                selected={weightRow === RAW_SUM}
                onSelect={selectRaw}
                onOpen={openIngredients}
                knobId={INGREDIENTS_KNOB_ID}
              />
            ) : (
              shownIngredients.map((i) => (
                <DisplayRow
                  key={i.id}
                  {...weightField(i.id)}
                  label={simple ? t('calculator.dry') : i.excluded ? t('calculator.notCountedSuffix', { name: ingredientDisplayName(i) }) : ingredientDisplayName(i)}
                  text={texts[i.id] ?? ''}
                  lids={people.length}
                />
              ))
            )}
            <DisplayRow
              {...weightField(COOKED)}
              last
              label={cookedHere !== null && dish.cooked ? t('calculator.cookedAt', { time: clockTime(dish.cooked.at) }) : t('calculator.cooked')}
              text={cookedText}
              invalid={tareExceeds}
              lids={people.length}
            />
          </div>
          {/* One quiet line: what «Готовый» was weighed in, what that leaves and k. */}
          {/* Small to look at, 44 px to hit: the line pulls its margins in, the people get the height. */}
          <div className="-my-1.5 flex flex-wrap items-center gap-x-2">
            <TareSelect tares={tares} tareId={tareId} onTare={changeTare} onAdd={() => openScreen(newTarePath(dish.id), TARE_SELECT_ID)} />
            {tareExceeds ? (
              <span className="text-sm text-destructive">{t('calculator.lessThanTare')}</span>
            ) : (
              note && (
                <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                  {tareNote}
                  {tareNote !== null && phase.k && ' · '}
                  {phase.k && <KHint k={phase.k} />}
                </span>
              )
            )}
          </div>
        </section>

        <section aria-label={t('calculator.who')} data-hint="who" className="flex flex-col gap-2 px-1">
          {/* In «Доли» the number of portions sits beside the field: «Доли [− 7 +]», the bar below gets the width. */}
          <div className="flex items-center gap-2">
            <CompanyPicker
              className="min-w-0 flex-1"
              value={companyId}
              // Ticked only while the shares are the company's own: picking it again brings them back.
              ticked={matching && matching.id === companyId ? companyId : null}
              // Nobody yet: the field is named by its question, not «Свой состав · 0».
              customLabel={lineup.members.length > 0 ? t('calculator.ownLineupCount', { count: lineup.members.length }) : t('calculator.who')}
              onChange={choosePreset}
              onAdd={() => openScreen(newCompanyPath(dish.id), COMPANY_SELECT_ID)}
              onSaveCurrent={!inShares && people.length > 0 && !matching ? saveAsCompany : undefined}
              shares={{ active: inShares, label: t('calculator.shares'), onPick: () => switchMode('shares') }}
              onOwnLineup={inShares && companyId === null ? () => switchMode('people') : undefined}
            />
            {inShares && <PortionStepper count={people.length} onRemove={fewerPortions} onAdd={morePortions} />}
            {recipeAvailable && (
              <Toggle
                variant="outline"
                pressed={composition}
                onPressedChange={setComposition}
                // On: the card's ground and the ring of the current dish chip.
                className="shrink-0 data-[state=on]:bg-card data-[state=on]:shadow-[inset_0_0_0_2px_var(--foreground)] aria-pressed:bg-card"
              >
                {t('calculator.composition')}
              </Toggle>
            )}
          </div>
          <ShareSlider
            sharing={sharing}
            sharingSegments={segments.filter((x) => fixed[x.id] === undefined)}
            own={segments.filter((x) => fixed[x.id] !== undefined)}
            rest={
              people.length > 0 && phase.remainder.state === 'some'
                ? { share: phase.remainder.share, label: gramsLabel(portionGrams(phase.remainder, rawOf)) }
                : null
            }
            onChange={setPercents}
            keep={keepNow}
            keepMost={keepMost}
            onKeep={inShares ? undefined : setKeep}
            numbered={inShares}
            // Nobody yet: the bar's place is kept, so switching to «Доли» and back does not move anything;
            // a tap on it puts the cursor into «+ Имя».
            empty={{ label: t('common.company.addPeople'), fieldId: ADD_PERSON_ID }}
            hint="bar"
            chosenId={chosenId}
            onChoose={setChosen}
          />
          {Object.keys(fixed).length > 0 && (
            <div className="flex min-h-11 items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{t('calculator.hasOwn')}</span>
              <Button variant="outline" onClick={allToShares}>
                <Undo2Icon data-icon="inline-start" />
                {t('calculator.resetOwn')}
              </Button>
            </div>
          )}
          {inShares ? (
            // «Доли»: what goes into each container said once, then the containers, up to three to a row, stretched.
            <>
              <PortionSummary
                cooking={draft}
                result={result}
                portions={phase.portions}
                ownIds={Object.keys(fixed)}
                rawOf={rawOf}
                numberOf={(portionId) => placeOf(portionId) + 1}
                recipe={recipe}
              />
              <ul className={cn('grid gap-2', compactTiles ? 'grid-cols-4' : 'grid-cols-6')}>
                {gridPortions.map((p, i) => (
                  <PortionTile
                    key={p.portionId}
                    // Compact: four to a row; the one opened for typing and an own one take a row of their own.
                    className={
                      compactTiles
                        ? active === personKey(p.portionId) || fixed[p.portionId] !== undefined
                          ? 'col-span-4'
                          : undefined
                        : tileSpans[i]
                    }
                    cooking={draft}
                    result={result}
                    place={placeOf(p.portionId)}
                    lids={people.length}
                    computed={p}
                    dry={rawOf !== null}
                    grams={amountField(p.portionId)}
                    compact={compactTiles && fixed[p.portionId] === undefined}
                    chosen={p.portionId === chosenId}
                    onChoose={fixed[p.portionId] === undefined ? () => setChosen(p.portionId) : undefined}
                    copyable={!sameShares || fixed[p.portionId] !== undefined}
                    // The recipe sits where ⧉ sits; a tile of its own row keeps two columns, the narrow ones one.
                    recipe={recipe && (!sameShares || fixed[p.portionId] !== undefined) ? { ...recipe, oneColumn: oneColumn || (!compactTiles && tileSpans[i] !== 'col-span-6') } : undefined}
                  />
                ))}
              </ul>
            </>
          ) : (
            // A row's plate reaches 8 px past the column; the rows' own padding keeps their content in line.
            <ul className="-mx-2 flex flex-col gap-0.5" aria-live="polite">
              {phase.portions.map((p) => (
                <PersonResult
                  key={p.portionId}
                  cooking={draft}
                  result={result}
                  name={people.find((x) => x.id === p.portionId)?.name ?? ''}
                  place={placeOf(p.portionId)}
                  lids={people.length}
                  computed={p}
                  dry={rawOf !== null}
                  onRename={(name) => updatePerson(p.portionId, name)}
                  onRemove={() => removePerson(p.portionId)}
                  onReleaseOwn={() => releaseOwn(p.portionId)}
                  recipe={recipe}
                  grams={amountField(p.portionId)}
                  chosen={p.portionId === chosenId && sharing.length > 1}
                  onChoose={fixed[p.portionId] === undefined ? () => setChosen(p.portionId) : undefined}
                />
              ))}
              <AddPersonRow id={ADD_PERSON_ID} onAdd={addPerson} className="px-2" />
            </ul>
          )}
          {/* Own portions may leave part of the dish in the pot — say it, and say how much. */}
          {people.length > 0 && phase.remainder.state === 'some' && phase.remainder.cookedGrams !== null && (
            <p className="flex items-baseline justify-between gap-2 border-t pt-3 text-sm">
              <span>{t('calculator.potLeft')}</span>
              <span className="text-right whitespace-nowrap tabular-nums">
                <span className="text-xl font-semibold">{gramsText(phase.remainder.cookedGrams)}</span>
                {potRaw !== null && (
                  <span className="block text-muted-foreground">
                    {t('calculator.rawGrams', { grams: formatGrams(potRaw), raw: rawWord(dish.kind) })}
                  </span>
                )}
              </span>
            </p>
          )}
          {phase.remainder.state === 'over' && phase.foodGrams !== null && (
            <p className="border-t pt-3 text-sm text-destructive">
              {t('calculator.over', { grams: formatGrams(-phase.remainder.share * phase.foodGrams) })}
            </p>
          )}
        </section>

        <p className="hidden px-1 text-sm text-muted-foreground lg:block">{t('calculator.enterHint')}</p>
      </main>
      {outlet && <OverScreen>{outlet}</OverScreen>}
    </>
  )
}
