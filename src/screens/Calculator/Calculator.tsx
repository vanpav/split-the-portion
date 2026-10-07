import { ChevronDownIcon, ChevronUpIcon, Undo2Icon } from 'lucide-react'
import { useEffect, useEffectEvent, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Navigate, useNavigate, useOutlet } from 'react-router'
import { toast } from 'sonner'
import { OverScreen } from '@/app/OverScreen'
import { newCompanyPath, newTarePath } from '@/app/paths'
import { useReturnAnimation } from '@/app/screenAnimation'
import { AddPersonRow } from '@/components/AddPersonRow'
import { ShareSlider, type DishSegment } from '@/components/ShareSlider'
import { Button } from '@/components/ui/button'
import {
  addPortion,
  baseRawGrams,
  clockTime,
  companyLineup,
  computeCooking,
  cookedToday,
  cookingDraft,
  defaultShareWeight,
  dishLineup,
  dishPortions,
  exactPercents,
  formatGrams,
  formatInput,
  formatPercent,
  keepLimit,
  ingredientDisplayName,
  lineupCompany,
  lineupName,
  lineupPercents,
  liveTareId,
  matchingCompany,
  parseGrams,
  portionGrams,
  portionIn,
  rawFold,
  removeLastPortion,
  splitSummary,
  typedGrams,
  type Company,
  type CompanyMember,
  type Dish,
  type Id,
  type SplitMode,
} from '@/domain'
import { ADD_PERSON_ID, calculatorFieldId, COMPANY_SELECT_ID, focusOrBlur, TARE_SELECT_ID } from '@/lib/domIds'
import { cn } from '@/lib/utils'
import { newId } from '@/store/id'
import { usePrefsStore } from '@/store/prefs'
import { useAppStore } from '@/store/store'
import type { CalculatorOutlet } from './calculatorOutlet'
import { CompanyPicker } from './CompanyPicker'
import { DisplayRow } from './DisplayRow'
import { kText, portionName, rawWord } from './messages'
import { PersonResult } from './PersonResult'
import { PortionStepper } from './PortionStepper'
import { PortionSummary } from './PortionSummary'
import { PortionTile } from './PortionTile'
import { RawFoldTile } from './RawFoldTile'
import { TareSelect } from './TareSelect'

/** Row id of the weight after cooking; the other rows are ingredient ids. */
const COOKED = 'cooked'
/** A person's own portion (cooked grams) is a field too. */
const personKey = (personId: string) => `person:${personId}`
const personTarget = (row: string) => (row.startsWith('person:') ? row.slice('person:'.length) : null)

/** An own portion typed in the calculator. */
interface Own {
  unit: 'g' | '%'
  value: number
  /** Grams typed while «Сухой» was in focus: dry grams of this ingredient, not cooked. */
  raw?: Id
}

const ownCooked = (fixed: Record<string, Own>) =>
  Object.fromEntries(Object.entries(fixed).flatMap(([id, own]) => (own.unit === 'g' && !own.raw ? [[id, own.value]] : [])))
const ownRaw = (fixed: Record<string, Own>) =>
  Object.fromEntries(
    Object.entries(fixed).flatMap(([id, own]) =>
      own.unit === 'g' && own.raw ? [[id, { ingredientId: own.raw, grams: own.value }]] : [],
    ),
  )
const ownPercent = (fixed: Record<string, Own>) =>
  Object.fromEntries(Object.entries(fixed).flatMap(([id, own]) => (own.unit === '%' ? [[id, own.value]] : [])))

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
  const holdMs = useAppStore((s) => s.holdMs)
  const setCooked = useAppStore((s) => s.setCooked)
  // «Доли» (docs/SPEC.md §3б): this device's choice for every dish; the portions are per dish, here only.
  const splitMode = usePrefsStore((s) => s.splitMode)
  const setSplitMode = usePrefsStore((s) => s.setSplitMode)
  const storedPortions = usePrefsStore((s) => (id ? s.portions[id] : undefined))
  const setPortions = usePrefsStore((s) => s.setPortions)
  const inShares = splitMode === 'shares'
  const [now] = useState(() => new Date().toISOString())

  // Raw weights come from the dish (what was typed last time).
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries((dish?.ingredients ?? []).map((i) => [i.id, formatInput(i.rawGrams)])),
  )
  // «Готовый» is today's weighing of this dish, here or on another device of the group; once typed into
  // here, it is what is typed.
  const [cookedTouched, setCookedTouched] = useState(false)
  // The dish remembers the tare it is weighed in, as it does the raw weight. A tare deleted from the
  // library is no tare: weighed without it (docs/SPEC.md §8).
  const tareId = liveTareId(dish?.tareId ?? null, tares)
  const tare = tares.find((t) => t.id === tareId) ?? null
  const cookedHere = useMemo(() => (dish ? cookedToday(dish.cooked, tareId, new Date(now)) : null), [dish, tareId, now])
  const textOf = (row: string) => (row === COOKED && !cookedTouched ? formatInput(cookedHere) : (texts[row] ?? ''))
  const cookedText = textOf(COOKED)
  // A simple dish shows its product only: water or salt «не учитывать» do not change the portions.
  const shownIngredients = (dish?.ingredients ?? []).filter((i) => dish?.kind !== 'simple' || !i.excluded)
  // A composite dish starts folded: its weights come from last time, only «Готовый» is new.
  // Unfolded when a counted product has no weight yet — it has to be typed.
  const foldable = shownIngredients.length > 1
  const [folded, setFolded] = useState(() => foldable && shownIngredients.every((i) => i.excluded || i.rawGrams !== null))
  const rows = [...(folded ? [] : shownIngredients.map((i) => i.id)), COOKED]
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
  const [weightRow, setWeightRow] = useState(() => rows.find((r) => r !== COOKED && !texts[r]) ?? COOKED)
  // Today's own portions, in cooked grams or in percent of the dish: these people get exactly that,
  // the rest split what is left by share.
  const [fixed, setFixed] = useState<Record<Id, Own>>({})
  // The unit the active person's number is typed in.
  const [unit, setUnit] = useState<Own['unit']>('g')
  // What the share bar shows: grams or percent; people show it too until switched one by one.
  const [barUnit, setBarUnit] = useState<Own['unit']>('g')
  // A person's own «г / %» switch, by id.
  const [shown, setShown] = useState<Record<Id, Own['unit']>>({})
  // «На завтра»: percent of the dish set aside, pulled in from the bar's right edge.
  const [keep, setKeep] = useState(0)

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
          scaleGrams: toNumber(cookedTouched ? (texts[COOKED] ?? '') : formatInput(cookedHere)),
          tare,
          people,
          companyId,
          fixedCooked: ownCooked(fixed),
          fixedRaw: ownRaw(fixed),
          fixedPercent: ownPercent(fixed),
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
  // The dry view: only the ingredient k is counted by (one counted product) has a dry weight to split.
  const rawOf = result && result.baseIngredientId !== null && weightRow === result.baseIngredientId ? weightRow : null

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
    if (personId) setOwn(personId, grams, unit, rawOf)
  }
  // The weight typed here now means the weight in the new tare. One from elsewhere was weighed in the
  // old tare: it no longer fits and is not shown.
  const changeTare = (next: Id | null) =>
    remember({ tareId: next, cooked: cookedTouched && dish?.cooked ? { ...dish.cooked, tareId: next } : (dish?.cooked ?? null) })
  const fold = () => {
    setFolded(true)
    if (shownIngredients.some((i) => i.id === active)) setActive(null)
    setWeightRow(COOKED)
  }
  const leave = () => setActive(null)
  // Leaving a person's field from a button that changes them: what was typed is settled first.
  const leavePerson = (personId: Id) => {
    if (active === personKey(personId)) focusOrBlur(null)
  }
  const setOwn = (personId: Id, value: number | null, ownUnit: Own['unit'], raw: Id | null) =>
    setFixed((f) => {
      const { [personId]: _old, ...rest } = f
      if (value === null || value <= 0 || (ownUnit === '%' && value > 100)) return rest
      const own: Own = ownUnit === 'g' && raw ? { unit: ownUnit, value, raw } : { unit: ownUnit, value }
      return { ...rest, [personId]: own }
    })
  const activatePerson = (personId: Id) => {
    const key = personKey(personId)
    const own = fixed[personId]
    const ownUnit = own?.unit ?? shown[personId] ?? barUnit
    // An own portion typed in the other view (dry ⇄ cooked) is shown in this one.
    const computed = phase?.portions.find((p) => p.portionId === personId)
    const sameView = own && (own.unit === '%' || (own.raw ?? null) === rawOf)
    const value = !own ? null : sameView ? own.value : computed ? portionIn(computed, own.unit, rawOf) : null
    setUnit(ownUnit)
    setTexts((t) => ({ ...t, [key]: value !== null ? formatInput(value) : '' }))
    setActive(key)
  }
  // г ⇄ %: the number typed so far is converted, so the person keeps the same portion.
  const switchUnit = (personId: Id, next: Own['unit']) => {
    if (next === unit) return
    const computed = phase?.portions.find((p) => p.portionId === personId)
    const converted = fixed[personId] === undefined || !computed ? null : portionIn(computed, next, rawOf)
    setUnit(next)
    setOwn(personId, converted, next, rawOf)
    setTexts((t) => ({ ...t, [personKey(personId)]: converted !== null ? formatInput(converted) : '' }))
  }
  // What a person's number is in: typed now, their own portion, their switch, or the bar's.
  const unitOf = (personId: Id): Own['unit'] =>
    active === personKey(personId) ? unit : (fixed[personId]?.unit ?? shown[personId] ?? barUnit)
  // The «г / %» switch in a person's field: the same portion, shown (and typed) in the other unit.
  const toggleUnit = (personId: Id) => {
    const next = unitOf(personId) === 'g' ? '%' : 'g'
    setShown((s) => ({ ...s, [personId]: next }))
    if (active === personKey(personId)) return switchUnit(personId, next)
    const computed = phase?.portions.find((p) => p.portionId === personId)
    if (fixed[personId] !== undefined && computed) setOwn(personId, portionIn(computed, next, rawOf), next, rawOf)
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
    setShown({})
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
  // The field focused again once the screen is gone: the one it was opened from, or «+ Имя» after a new company.
  const refocus = useRef<string | null>(null)
  const outlet = useOutlet({
    dishId: id ?? '',
    onTare: (picked) => changeTare(picked.id),
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
    toast(name ? `Убрано: ${name}` : 'Человек убран', {
      duration: 5000,
      action: {
        label: 'Отменить',
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
    const saved = upsertCompany({ name: lineupName(people), members: people.map((p) => ({ ...p })) })
    if (dish) setLineup(dish.id, { companyId: saved, members: people })
    toast('Компания сохранена', { description: lineupName(people) })
  }

  // A person's or a portion's amount as a field: tap it and type their own portion.
  const amountField = (personId: Id) => ({
    id: calculatorFieldId(personKey(personId)),
    active: active === personKey(personId),
    text: texts[personKey(personId)] ?? '',
    own: fixed[personId] !== undefined,
    unit: unitOf(personId),
    onFocus: () => activatePerson(personId),
    onBlur: leave,
    onText: (typed: string) => type(personKey(personId), typed),
    onKeyDown: fieldKeys(personKey(personId)),
  })
  const gramsLabel = (grams: number | null) => (grams !== null ? `${formatGrams(grams)} г` : null)
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
  const potRaw = result && phase ? baseRawGrams(result, phase.remainder.raw) : null
  // What the people who split by share get together, in grams of the view: «17 % из 440 г».
  const sharingGrams = (phase?.portions ?? []).filter((p) => fixed[p.portionId] === undefined).map((p) => portionGrams(p, rawOf))
  const sharedGrams = sharingGrams.every((g) => g !== null) ? sharingGrams.reduce<number>((a, g) => a + (g ?? 0), 0) : null
  // «Доли»: the portions that split by share all get the same — one ⧉ above the grid copies any of them.
  const sameShares = splitSummary(sharingGrams)?.same != null

  if (!dish || !draft || !result || !phase) return <Navigate to="/" replace />
  const simple = dish.kind === 'simple'
  // Two tiles side by side: one product, or a composite dish folded to its raw weight.
  const tiles = !foldable || folded
  const raw = rawFold(shownIngredients.map((i) => ({ ...i, rawGrams: toNumber(texts[i.id] ?? '') })))

  // Under the readouts, after the tare: the weight without it and k.
  const note = [tare && phase.foodGrams !== null && `${formatGrams(phase.foodGrams)} г без тары`, phase.k && kText(phase.k, false)]
    .filter((part): part is string => Boolean(part))
    .join(' · ')
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
        <section aria-label="Вес" className="flex flex-col gap-1">
          {/* «Сухой | Готовый» side by side for one product, «Сырой | Готовый» for a folded composite dish;
              unfolded, its products are small tiles two to a row and «Готовый» goes across. */}
          <div className="grid grid-cols-2 gap-2">
            {folded ? (
              <RawFoldTile total={raw.total} note={raw.note} onExpand={() => setFolded(false)} />
            ) : (
              shownIngredients.map((i) => (
                <DisplayRow
                  key={i.id}
                  {...weightField(i.id)}
                  label={simple ? 'Сухой' : `${ingredientDisplayName(i)}${i.excluded ? ' · не учит.' : ''}`}
                  text={texts[i.id] ?? ''}
                  small={!tiles}
                  lids={people.length}
                />
              ))
            )}
            <DisplayRow
              {...weightField(COOKED)}
              last
              label={cookedHere !== null && dish.cooked ? `Готовый · ${clockTime(dish.cooked.at)}` : 'Готовый'}
              text={cookedText}
              className={tiles ? undefined : 'col-span-2'}
              invalid={tareExceeds}
              lids={people.length}
            />
          </div>
          {/* One quiet line: what «Готовый» was weighed in, what that leaves and k; a composite dish folds here. */}
          {/* Small to look at, 44 px to hit: the line pulls its margins in, the people get the height. */}
          <div className="-my-1.5 flex flex-wrap items-center gap-x-2">
            <TareSelect tares={tares} tareId={tareId} onTare={changeTare} onAdd={() => openScreen(newTarePath(dish.id), TARE_SELECT_ID)} />
            {tareExceeds ? (
              <span className="text-sm text-destructive">вес меньше тары</span>
            ) : (
              note && <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">{note}</span>
            )}
            {foldable && (
              <Button
                variant="ghost"
                aria-expanded={!folded}
                // A quiet line: open or not, the button stays text, without the pressed fill.
                className="ml-auto px-2 text-muted-foreground aria-expanded:bg-transparent"
                onClick={folded ? () => setFolded(false) : fold}
              >
                {folded ? 'Продукты' : 'Свернуть'}
                {folded ? <ChevronDownIcon data-icon="inline-end" /> : <ChevronUpIcon data-icon="inline-end" />}
              </Button>
            )}
          </div>
        </section>

        <section aria-label="Кто ест" className="flex flex-col gap-2 px-1">
          {/* In «Доли» the number of portions sits beside the field: «Доли [− 7 +]», the bar below gets the width. */}
          <div className="flex items-center gap-2">
            <CompanyPicker
              className="min-w-0 flex-1"
              value={companyId}
              // Ticked only while the shares are the company's own: picking it again brings them back.
              ticked={matching && matching.id === companyId ? companyId : null}
              // Nobody yet: the field is named by its question, not «Свой состав · 0».
              customLabel={lineup.members.length > 0 ? `Свой состав · ${lineup.members.length}` : 'Кто ест'}
              onChange={choosePreset}
              onAdd={() => openScreen(newCompanyPath(dish.id), COMPANY_SELECT_ID)}
              onSaveCurrent={!inShares && people.length > 0 && !matching ? saveAsCompany : undefined}
              shares={{ active: inShares, label: 'Доли', onPick: () => switchMode('shares') }}
              onOwnLineup={inShares && companyId === null ? () => switchMode('people') : undefined}
            />
            {inShares && <PortionStepper count={people.length} onRemove={fewerPortions} onAdd={morePortions} />}
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
            unit={barUnit}
            onUnit={setBarUnit}
            numbered={inShares}
            // Nobody yet: the bar's place is kept, so switching to «Доли» and back does not move anything.
            empty="Добавьте людей"
            sharedLabel={sharedGrams !== null && sharedGrams > 0 ? gramsLabel(sharedGrams) : null}
          />
          {Object.keys(fixed).length > 0 && (
            <div className="flex min-h-11 items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>Есть свои порции</span>
              <Button variant="outline" onClick={allToShares}>
                <Undo2Icon data-icon="inline-start" />
                Сбросить свои
              </Button>
            </div>
          )}
          {inShares ? (
            // «Доли»: what goes into each container said once, then the containers, three to a row.
            <>
              <PortionSummary
                cooking={draft}
                result={result}
                portions={phase.portions}
                ownIds={Object.keys(fixed)}
                rawOf={rawOf}
                unit={barUnit}
                numberOf={(portionId) => placeOf(portionId) + 1}
              />
              <ul className="grid grid-cols-3 gap-2 max-[360px]:grid-cols-2 lg:grid-cols-4">
                {phase.portions.map((p) => (
                  <PortionTile
                    key={p.portionId}
                    cooking={draft}
                    result={result}
                    place={placeOf(p.portionId)}
                    lids={people.length}
                    computed={p}
                    dry={rawOf !== null}
                    grams={amountField(p.portionId)}
                    copyable={!sameShares || fixed[p.portionId] !== undefined}
                  />
                ))}
              </ul>
            </>
          ) : (
            <ul className="flex flex-col divide-y" aria-live="polite">
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
                  holdMs={holdMs}
                  onReleaseOwn={() => releaseOwn(p.portionId)}
                  percent={p.share !== null && p.share > 0 ? formatPercent(p.share) : null}
                  grams={{ ...amountField(p.portionId), onToggleUnit: () => toggleUnit(p.portionId) }}
                />
              ))}
              <AddPersonRow id={ADD_PERSON_ID} onAdd={addPerson} />
            </ul>
          )}
          {/* Own portions may leave part of the dish in the pot — say it, and say how much. */}
          {people.length > 0 && phase.remainder.state === 'some' && phase.remainder.cookedGrams !== null && (
            <p className="flex items-baseline justify-between gap-2 border-t pt-3 text-sm">
              <span>В кастрюле останется — на завтра</span>
              <span className="text-right whitespace-nowrap tabular-nums">
                <span className="text-xl font-semibold">{formatGrams(phase.remainder.cookedGrams)} г</span>
                {potRaw !== null && (
                  <span className="block text-muted-foreground">
                    {formatGrams(potRaw)} г {rawWord(dish.kind)}
                  </span>
                )}
              </span>
            </p>
          )}
          {phase.remainder.state === 'over' && phase.foodGrams !== null && (
            <p className="border-t pt-3 text-sm text-destructive">
              Своих порций больше, чем сварено: не хватает {formatGrams(-phase.remainder.share * phase.foodGrams)} г.
            </p>
          )}
        </section>

        <p className="hidden px-1 text-sm text-muted-foreground lg:block">Enter или ↓ — следующее поле.</p>
      </main>
      {outlet && <OverScreen>{outlet}</OverScreen>}
    </>
  )
}
