import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { DISHES_PATH, dishPath } from '@/app/paths'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { asSimple, dishErrors, dishKind, dishSource, dishTitle, liveTareId, type CookingKind, type DishError, type Id, type Ingredient } from '@/domain'
import { focusOrBlur, ingredientNameId } from '@/lib/domIds'
import type { DishDraft } from '@/store/createAppStore'
import { newId } from '@/store/id'
import { useAppStore } from '@/store/store'
import { DishActions } from './DishActions'
import { FromSimpleDishPicker } from './FromSimpleDishPicker'
import { IngredientEditorRow } from './IngredientEditorRow'

const NONE = 'none'

const ERROR_TEXT: Record<DishError, string> = {
  noIngredients: 'Введите продукт',
  badWeight: 'Вес должен быть больше 0',
}

const emptyIngredient = (): Ingredient => ({ id: newId(), name: '', rawGrams: null, excluded: false })
const isEmpty = (i: Ingredient) => !i.name.trim() && i.rawGrams === null && !i.excluded

/**
 * Create or edit a dish (recipe). One form for both kinds: the kind is chosen at the top and follows
 * the ingredients (`dishKind`) as they are typed. Nothing is saved until «Создать» / «Сохранить».
 * `/d/new[?from=<simple dish>]` or `/d/:id/edit`; the draft is taken from the route once, on mount.
 */
export function DishEditorForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dishes = useAppStore((s) => s.dishes)
  const tares = useAppStore((s) => s.tares)
  const saveDish = useAppStore((s) => s.saveDish)

  const existing = id ? dishes.find((d) => d.id === id) : undefined
  const [draft, setDraft] = useState<DishDraft | null>(() => {
    if (existing) return { ...existing, ingredients: existing.ingredients.map((i) => ({ ...i })) }
    if (id) return null
    const base = dishes.find((d) => d.id === params.get('from'))
    const source = base && dishSource(base)
    return {
      kind: 'simple',
      name: '',
      ingredients: source ? [{ ...emptyIngredient(), ...source }, emptyIngredient()] : [emptyIngredient()],
      // Not everyone weighs in a pot: a new dish starts without tare.
      tareId: null,
    }
  })
  // The kind picked by hand, until the ingredients say it themselves.
  const [intent, setIntent] = useState<CookingKind | null>(null)
  // The row that gets focus: the first empty one when the form opens, then a freshly added one.
  const [focusId, setFocusId] = useState<Id | null>(
    () => draft?.ingredients.find((i) => !i.name.trim())?.id ?? null,
  )

  if (!draft) return <Navigate to="/" replace />
  const isNew = !existing
  const errors = dishErrors(draft)
  const kind = dishKind(draft.ingredients)
  // «Составное» chosen before the second product is typed: the form is composite already.
  const shownKind: CookingKind = kind === 'composite' ? 'composite' : (intent ?? 'simple')

  const patch = (p: Partial<DishDraft>) => setDraft({ ...draft, ...p })
  const setIngredient = (ingredientId: Id, p: Partial<Ingredient>) =>
    patch({ ingredients: draft.ingredients.map((i) => (i.id === ingredientId ? { ...i, ...p } : i)) })
  const addIngredient = (from?: Partial<Ingredient>) => {
    const next = { ...emptyIngredient(), ...from }
    const last = draft.ingredients.at(-1)
    // «Из простого блюда» takes the place of an empty last row.
    const kept = from && last && isEmpty(last) ? draft.ingredients.slice(0, -1) : draft.ingredients
    patch({ ingredients: [...kept, next] })
    if (!from) setFocusId(next.id)
  }
  // A swipe can remove by accident: «Отменить» puts the row back in its place.
  const removeIngredient = (ingredientId: Id) => {
    const index = draft.ingredients.findIndex((i) => i.id === ingredientId)
    const gone = draft.ingredients[index]
    if (!gone) return
    patch({ ingredients: draft.ingredients.filter((i) => i.id !== ingredientId) })
    toast(gone.name.trim() ? `Удалено: ${gone.name.trim()}` : 'Ингредиент удалён', {
      duration: 5000,
      action: {
        label: 'Отменить',
        onClick: () =>
          setDraft((d) => d && { ...d, ingredients: [...d.ingredients.slice(0, index), gone, ...d.ingredients.slice(index)] }),
      },
    })
  }
  const focusNextIngredient = (index: number) => {
    const next = draft.ingredients[index + 1]
    if (next) focusOrBlur(ingredientNameId(next.id))
    else addIngredient()
  }

  // «Составное»: a row for the next product, the cursor in it. «Простое»: the first product stays, the
  // other counted ones go — nothing is saved yet, and «Вернуть» brings them back.
  const chooseKind = (next: CookingKind) => {
    if (next === shownKind) return
    setIntent(next)
    if (next === 'composite') {
      const empty = draft.ingredients.find((i) => !i.name.trim())
      if (draft.ingredients.length < 2 || !empty) addIngredient()
      else focusOrBlur(ingredientNameId(empty.id))
      return
    }
    const before = draft.ingredients
    const kept = asSimple(before)
    if (kept.length === before.length) return
    patch({ ingredients: kept })
    const gone = before.length - kept.length
    toast('Блюдо стало простым', {
      description: `Убрано продуктов: ${gone}`,
      action: {
        label: 'Вернуть',
        onClick: () => {
          setDraft((d) => d && { ...d, ingredients: before })
          setIntent('composite')
        },
      },
    })
  }

  const save = () => {
    if (errors.length > 0) return
    const ingredients = draft.ingredients.filter((i) => !isEmpty(i))
    const savedId = saveDish({ ...draft, kind, name: draft.name.trim(), ingredients })
    navigate(dishPath(savedId), { replace: true })
  }
  const backTo = existing ? dishPath(existing.id) : DISHES_PATH

  return (
    <>
      <ScreenHeader
        title={isNew ? 'Добавить блюдо' : 'Изменить блюдо'}
        back
        backTo={backTo}
        backLabel={existing ? 'Калькулятор' : 'Блюда'}
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4">
        <section className="flex flex-col gap-2">
          {/* A choice, and it follows the ingredients too: two counted products make the dish composite. */}
          <ToggleGroup
            type="single"
            variant="outline"
            aria-label="Вид блюда"
            value={shownKind}
            onValueChange={(v) => v && chooseKind(v as CookingKind)}
            className="w-full"
          >
            <ToggleGroupItem value="simple" className="min-h-11 flex-1">
              Простое
            </ToggleGroupItem>
            <ToggleGroupItem value="composite" className="min-h-11 flex-1">
              Составное
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {shownKind === 'simple'
              ? 'Один продукт. Воду, соль и специи можно добавить с отметкой «не учитывать» — блюдо останется простым.'
              : 'Несколько ингредиентов в учёте: порцию покажем с составом. Воду, соль и специи отметьте «не учитывать».'}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Продукты</h2>
          {/* Rows are padded and divided themselves, so a removed one folds up with nothing left behind;
              the negative margin keeps the section's own gap to the heading and the buttons. */}
          <div className="-my-3 flex flex-col divide-y">
            {draft.ingredients.map((ingredient, index) => (
              <IngredientEditorRow
                key={ingredient.id}
                ingredient={ingredient}
                index={index}
                placeholder={index === 0 ? 'Макароны' : 'Фарш, соль…'}
                autoFocus={focusId === ingredient.id}
                onChange={(p) => setIngredient(ingredient.id, p)}
                onRemove={() => removeIngredient(ingredient.id)}
                onEnter={() => focusNextIngredient(index)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => addIngredient()}>
              <PlusIcon data-icon="inline-start" />
              Ингредиент
            </Button>
            <FromSimpleDishPicker onPick={(source) => addIngredient(source)} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">Как обычно</h2>
          <Field>
            <FieldLabel htmlFor="dish-name">Название</FieldLabel>
            <Input
              id="dish-name"
              placeholder={dishTitle({ name: '', ingredients: draft.ingredients })}
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
            <FieldDescription>Можно не заполнять — назовём по продуктам.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="dish-tare">В чём взвешиваете</FieldLabel>
            <Select value={liveTareId(draft.tareId, tares) ?? NONE} onValueChange={(v) => patch({ tareId: v === NONE ? null : v })}>
              <SelectTrigger id="dish-tare" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Без тары</SelectItem>
                {tares.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.grams} г
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tares.length === 0 && <FieldDescription>Тару можно добавить в настройках.</FieldDescription>}
          </Field>
        </section>

        {existing && <DishActions dish={existing} />}

        <BottomBar>
          <div className="flex flex-1 flex-col gap-2">
            {errors.length > 0 && (
              <p className="text-sm text-muted-foreground">{errors.map((e) => ERROR_TEXT[e]).join(' · ')}</p>
            )}
            <div className="flex gap-2">
              <Button size="lg" className="flex-1 lg:flex-none" disabled={errors.length > 0} onClick={save}>
                {isNew ? 'Создать' : 'Сохранить'}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate(backTo)}>
                Отмена
              </Button>
            </div>
          </div>
        </BottomBar>
      </main>
    </>
  )
}
