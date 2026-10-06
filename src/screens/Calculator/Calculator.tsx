import { HistoryIcon, PencilIcon, PercentIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { cookingPath, dishEditPath, dishHistoryPath, dishListPath } from '@/app/paths'
import { AddPersonRow } from '@/components/AddPersonRow'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ShareSlider, type DishSegment } from '@/components/ShareSlider'
import { Button } from '@/components/ui/button'
import {
  applyKey,
  baseRawGrams,
  computeCooking,
  cookingDraft,
  defaultShareWeight,
  dishTitle,
  formatGrams,
  formatInput,
  formatPercent,
  keepLimit,
  ingredientDisplayName,
  keypadKeyFromKeyboard,
  lineupName,
  matchingCompany,
  parseGrams,
  portionIn,
  toPercents,
  usualScaleGrams,
  type CompanyMember,
  type Id,
  type KeypadKey,
} from '@/domain'
import { CompanyPicker } from '@/screens/Cooking/CompanyPicker'
import { kText, rawWord } from '@/screens/Cooking/messages'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'
import { CookedRow } from './CookedRow'
import { DisplayRow } from './DisplayRow'
import { Keypad } from './Keypad'
import { PersonResult } from './PersonResult'

/** Row id of the weight after cooking; the other rows are ingredient ids. */
const COOKED = 'cooked'
/** A person's own portion (cooked grams) is a keypad target too. */
const personKey = (personId: string) => `person:${personId}`
const personTarget = (row: string) => (row.startsWith('person:') ? row.slice('person:'.length) : null)

/** An own portion typed in the calculator. */
interface Own {
  unit: 'g' | '%'
  value: number
}

const ownOf = (fixed: Record<string, Own>, unit: Own['unit']) =>
  Object.fromEntries(Object.entries(fixed).flatMap(([id, own]) => (own.unit === unit ? [[id, own.value]] : [])))

const toNumber = (text: string) => {
  const parsed = parseGrams(text)
  return parsed.ok ? parsed.value : null
}

/**
 * Opening a dish: a calculator, like a unit converter (docs/SPEC.md §3б). Raw weight comes from
 * the recipe, the cooked weight is typed, each person's portion updates on every key.
 * Nothing is stored until «Сохранить». Mounted per dish (see CalculatorScreen).
 */
export function Calculator({ id }: { id: Id | undefined }) {
  const navigate = useNavigate()
  const dish = useAppStore((s) => s.dishes.find((d) => d.id === id))
  const tares = useAppStore((s) => s.tares)
  const companies = useAppStore((s) => s.companies)
  const saveCooking = useAppStore((s) => s.saveCooking)
  const cookings = useAppStore((s) => s.cookings)
  const lineup = useAppStore((s) => s.lineup)
  const setLineup = useAppStore((s) => s.setLineup)
  const upsertCompany = useAppStore((s) => s.upsertCompany)
  const holdMs = useAppStore((s) => s.holdMs)

  // «Готовый» starts with the weight typed most often for this dish and tare (from saved cookings).
  const usual = (tare: Id | null) => (dish ? formatInput(usualScaleGrams(cookings, dish.id, tare)) : '')
  const [texts, setTexts] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries((dish?.ingredients ?? []).map((i) => [i.id, formatInput(i.rawGrams)])),
    [COOKED]: usual(dish?.tareId ?? null),
  }))
  // Until typed into, «Готовый» keeps following the usual value (e.g. when the tare changes).
  const [cookedTouched, setCookedTouched] = useState(false)
  // A simple dish shows its product only: water or salt «не учитывать» do not change the portions.
  const shownIngredients = (dish?.ingredients ?? []).filter((i) => dish?.kind !== 'simple' || !i.excluded)
  const rows = [...shownIngredients.map((i) => i.id), COOKED]
  // Start where the number is missing: usually the weight after cooking.
  const [active, setActive] = useState<string>(() => rows.find((r) => !texts[r]) ?? COOKED)
  // The first key after activating a row replaces its value, as on a calculator.
  const [fresh, setFresh] = useState(true)
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
  // While a name is typed the system keyboard is up: our keypad steps aside.
  const [editingName, setEditingName] = useState(false)
  const [tareId, setTareId] = useState<Id | null>(dish?.tareId ?? null)
  const [now] = useState(() => new Date().toISOString())

  const tare = tares.find((t) => t.id === tareId) ?? null
  // «Сегодня едят» is shared by all dishes; before it is first changed, the first company.
  const people = useMemo(
    () => lineup ?? companies[0]?.members ?? [],
    [lineup, companies],
  )
  const company = matchingCompany(people, companies)
  const base = useMemo(
    () =>
      dish &&
      cookingDraft(
        dish,
        {
          rawGrams: Object.fromEntries(dish.ingredients.map((i) => [i.id, toNumber(texts[i.id] ?? '')])),
          scaleGrams: toNumber(texts[COOKED]),
          tare,
          people,
          companyId: company?.id ?? null,
          fixedCooked: ownOf(fixed, 'g'),
          fixedPercent: ownOf(fixed, '%'),
        },
        now,
      ),
    [dish, texts, tare, people, company, fixed, now],
  )
  // «На завтра» is cut from what the sharing people hold: with nothing set aside they hold all that is free.
  // Own portions typed later may leave less, so the cut is held to what is possible now.
  const keepMost = useMemo(() => {
    const phase = base && computeCooking(base).phases[0]
    return phase ? keepLimit(phase, people.filter((p) => fixed[p.id] === undefined).map((p) => p.id)) : 0
  }, [base, people, fixed])
  const keepNow = Math.min(keep, keepMost)
  const draft = useMemo(() => base && (keepNow > 0 ? { ...base, keepPercent: keepNow } : base), [base, keepNow])
  const result = useMemo(() => (draft ? computeCooking(draft) : undefined), [draft])

  const press = (key: KeypadKey) => {
    const next = applyKey(texts[active] ?? '', key, fresh)
    setTexts((t) => ({ ...t, [active]: next }))
    setFresh(false)
    if (active === COOKED) setCookedTouched(true)
    // A person's number: a value makes it their own portion, an empty field gives them back to the shares.
    const personId = personTarget(active)
    if (personId) setOwn(personId, toNumber(next), unit)
  }
  const changeTare = (next: Id | null) => {
    setTareId(next)
    if (!cookedTouched) setTexts((t) => ({ ...t, [COOKED]: usual(next) }))
  }
  const activate = (row: string) => {
    setActive(row)
    setFresh(true)
  }
  const setOwn = (personId: Id, value: number | null, ownUnit: Own['unit']) =>
    setFixed((f) => {
      const { [personId]: _old, ...rest } = f
      const valid = value !== null && value > 0 && (ownUnit === 'g' || value <= 100)
      return valid ? { ...rest, [personId]: { unit: ownUnit, value } } : rest
    })
  const activatePerson = (personId: Id) => {
    const key = personKey(personId)
    const own = fixed[personId]
    setUnit(own?.unit ?? shown[personId] ?? barUnit)
    setTexts((t) => ({ ...t, [key]: own ? formatInput(own.value) : '' }))
    activate(key)
  }
  // г ⇄ %: the number typed so far is converted, so the person keeps the same portion.
  const switchUnit = (personId: Id, next: Own['unit']) => {
    if (next === unit) return
    const computed = result?.phases[0]?.portions.find((p) => p.portionId === personId)
    const converted = fixed[personId] === undefined || !computed ? null : portionIn(computed, next)
    setUnit(next)
    setOwn(personId, converted, next)
    setTexts((t) => ({ ...t, [personKey(personId)]: converted !== null ? formatInput(converted) : '' }))
    setFresh(true)
  }
  // What a person's number is in: typed now, their own portion, their switch, or the bar's.
  const unitOf = (personId: Id): Own['unit'] =>
    active === personKey(personId) ? unit : (fixed[personId]?.unit ?? shown[personId] ?? barUnit)
  // The «г / %» switch in a person's field: the same portion, shown (and typed) in the other unit.
  const toggleUnit = (personId: Id) => {
    const next = unitOf(personId) === 'g' ? '%' : 'g'
    setShown((s) => ({ ...s, [personId]: next }))
    if (active === personKey(personId)) return switchUnit(personId, next)
    const computed = result?.phases[0]?.portions.find((p) => p.portionId === personId)
    if (fixed[personId] !== undefined && computed) setOwn(personId, portionIn(computed, next), next)
  }
  // ↓ walks the weights; from a person it goes back to «Готовый».
  const move = (step: 1 | -1) => {
    const index = rows.indexOf(active)
    activate(index === -1 ? COOKED : rows[(index + step + rows.length) % rows.length])
  }

  const choosePreset = (presetId: Id) => {
    const preset = companies.find((c) => c.id === presetId)
    if (preset) setLineup(preset.members.map((m) => ({ ...m })))
  }
  const addPerson = (name: string) => {
    const person: CompanyMember = { id: newId(), name, weight: defaultShareWeight(people.map((p) => p.weight)) }
    setLineup([...people, person])
  }
  const updatePerson = (personId: Id, name: string) =>
    setLineup(people.map((p) => (p.id === personId ? { ...p, name } : p)))
  const removePerson = (personId: Id) => {
    setLineup(people.filter((p) => p.id !== personId))
    setFixed(({ [personId]: _removed, ...rest }) => rest)
    if (active === personKey(personId)) activate(COOKED)
  }
  // The slider splits what is left after own portions: it only shows the people who share.
  const sharing = people.filter((p) => fixed[p.id] === undefined)
  // The share slider works in whole percents: shares become them.
  const setPercents = (percents: number[]) =>
    setLineup(
      people.map((p) => {
        const index = sharing.findIndex((x) => x.id === p.id)
        return index === -1 ? p : { ...p, weight: percents[index] ?? p.weight }
      }),
    )
  // Back to shares. One person keeps their old share; «Всё в доли» keeps today's split as it is.
  const releaseOwn = (personId: Id) => {
    setFixed(({ [personId]: _released, ...rest }) => rest)
    if (active === personKey(personId)) activate(COOKED)
  }
  const allToShares = () => {
    const shares = people.map((p) => Math.max(phase?.portions.find((x) => x.portionId === p.id)?.share ?? 0, 0))
    if (shares.some((x) => x > 0)) {
      const percents = toPercents(shares)
      setLineup(people.map((p, i) => ({ ...p, weight: percents[i] })))
    }
    setFixed({})
    if (personTarget(active)) activate(COOKED)
  }
  const saveAsCompany = () => {
    upsertCompany({ name: lineupName(people), members: people.map((p) => ({ ...p })) })
    toast('Компания сохранена', { description: lineupName(people) })
  }

  const phase = result?.phases[0]
  const gramsLabel = (grams: number | null) => (grams !== null ? `${formatGrams(grams)} г` : null)
  // Each person's part of the whole dish, for the bar.
  const segments: DishSegment[] = (phase?.portions ?? []).map((p) => ({
    id: p.portionId,
    name: people.find((x) => x.id === p.portionId)?.name ?? '',
    share: Math.max(p.share ?? 0, 0),
    label: gramsLabel(p.cookedGrams),
  }))
  const canSave = phase?.foodGrams != null
  const potRaw = result && phase ? baseRawGrams(result, phase.remainder.raw) : null
  const save = () => {
    if (!draft || !canSave) return
    const cookingId = saveCooking(draft)
    toast('Сохранено в историю')
    navigate(cookingPath(cookingId))
  }

  // A physical keyboard types into the display too (desktop, a phone with a keyboard).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [role=listbox], [role=dialog]')) return
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        move(1)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        move(-1)
        return
      }
      const key = keypadKeyFromKeyboard(e.key)
      if (key) {
        e.preventDefault()
        press(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!dish || !draft || !result || !phase) return <Navigate to="/" replace />
  const title = dishTitle(dish)
  const simple = dish.kind === 'simple'
  const compact = rows.length > 2

  // In «Готовый», bottom right under the number: the weight without the tare and k.
  const note = [tare && phase.foodGrams !== null && `${formatGrams(phase.foodGrams)} г без тары`, phase.k && kText(phase.k, false)]
    .filter((part): part is string => Boolean(part))
    .join(' · ')
  const tareExceeds = phase.weighingError === 'tareExceeds'

  return (
    <>
      <ScreenHeader
        title={title}
        back
        backTo={dishListPath(dish.kind)}
        action={
          <>
            <Button variant="ghost" size="icon" asChild>
              <Link to={dishHistoryPath(dish.id)} aria-label="История готовок">
                <HistoryIcon />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to={dishEditPath(dish.id)} aria-label="Изменить блюдо">
                <PencilIcon />
              </Link>
            </Button>
          </>
        }
      />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-3 pt-3">
        <section aria-label="Вес" className="flex flex-col gap-1">
          {shownIngredients.map((i) => (
            <DisplayRow
              key={i.id}
              label={simple ? 'Сухой' : `${ingredientDisplayName(i)}${i.excluded ? ' · не учит.' : ''}`}
              text={texts[i.id] ?? ''}
              active={active === i.id}
              compact={compact}
              onActivate={() => activate(i.id)}
            />
          ))}
          <CookedRow
            label={`Готовый${!cookedTouched && texts[COOKED] ? ' · обычно' : ''}`}
            text={texts[COOKED]}
            active={active === COOKED}
            compact={compact}
            onActivate={() => activate(COOKED)}
            tares={tares}
            tareId={tareId}
            onTare={changeTare}
            note={note || null}
            error={tareExceeds ? 'вес меньше тары' : null}
          />
        </section>

        <section aria-label="Кто ест" className="flex flex-col gap-2 px-1">
          <CompanyPicker
            className="w-full"
            value={company?.id ?? null}
            customLabel={`Свой состав · ${people.length}`}
            onChange={choosePreset}
            onSaveCurrent={!company && people.length > 0 ? saveAsCompany : undefined}
          />
          <ShareSlider
            sharing={sharing}
            sharingSegments={segments.filter((x) => fixed[x.id] === undefined)}
            own={segments.filter((x) => fixed[x.id] !== undefined)}
            rest={
              people.length > 0 && phase.remainder.state === 'some'
                ? { share: phase.remainder.share, label: gramsLabel(phase.remainder.cookedGrams) }
                : null
            }
            onChange={setPercents}
            keep={keepNow}
            keepMost={keepMost}
            onKeep={setKeep}
            unit={barUnit}
            onUnit={setBarUnit}
          />
          {Object.keys(fixed).length > 0 && (
            <div className="flex min-h-11 items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>Есть свои порции</span>
              <Button variant="outline" onClick={allToShares}>
                <PercentIcon data-icon="inline-start" />
                Всё в доли
              </Button>
            </div>
          )}
          <ul className="flex flex-col divide-y" aria-live="polite">
              {phase.portions.map((p) => (
                <PersonResult
                  key={p.portionId}
                  cooking={draft}
                  result={result}
                  name={people.find((x) => x.id === p.portionId)?.name ?? ''}
                  computed={p}
                  onRename={(name) => updatePerson(p.portionId, name)}
                  onRemove={() => removePerson(p.portionId)}
                  holdMs={holdMs}
                  onEditingName={setEditingName}
                  onReleaseOwn={() => releaseOwn(p.portionId)}
                  percent={p.share !== null && p.share > 0 ? formatPercent(p.share) : null}
                  grams={{
                    active: active === personKey(p.portionId),
                    text: texts[personKey(p.portionId)] ?? '',
                    own: fixed[p.portionId] !== undefined,
                    unit: unitOf(p.portionId),
                    onToggleUnit: () => toggleUnit(p.portionId),
                    onActivate: () => activatePerson(p.portionId),
                  }}
                />
              ))}
              <AddPersonRow onAdd={addPerson} onEditingName={setEditingName} />
            </ul>
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
              Своих порций больше, чем сварено: не хватает{' '}
              {formatGrams(-phase.remainder.share * phase.foodGrams)} г.
            </p>
          )}
        </section>

        <p className="hidden px-1 text-sm text-muted-foreground lg:block">
          Цифры — с клавиатуры, Enter или ↓ — следующее поле.
        </p>

        <div className="sticky bottom-0 z-30 -mx-3 mt-auto border-t bg-background/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <div className={editingName ? 'hidden' : 'lg:hidden'}>
            <Keypad onKey={press} onNext={() => move(1)} onSave={save} saveDisabled={!canSave} />
          </div>
          <Button size="lg" className="hidden w-full lg:inline-flex" disabled={!canSave} onClick={save}>
            Сохранить в историю
          </Button>
        </div>
      </main>
    </>
  )
}
