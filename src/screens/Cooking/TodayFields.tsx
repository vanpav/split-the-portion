import { NumberField } from '@/components/NumberField'
import { ingredientDisplayName, type CookingKind, type Id, type Ingredient } from '@/domain'
import { focusOrBlur } from '@/lib/domIds'

const positive = (v: number | null) => (v !== null && v <= 0 ? 'Больше 0' : null)

interface TodayFieldsProps {
  kind: CookingKind
  ingredients: Ingredient[]
  onChange: (ingredientId: Id, rawGrams: number | null) => void
  autoFocus?: boolean
}

/** Today's raw weights, prefilled from the recipe; changing them does not touch the recipe. */
export function TodayFields({ kind, ingredients, onChange, autoFocus }: TodayFieldsProps) {
  const simple = kind === 'simple'
  return ingredients.map((ingredient, index) => (
    <NumberField
      key={ingredient.id}
      label={
        simple
          ? 'Сухой вес'
          : `${ingredientDisplayName(ingredient)}, сырой${ingredient.excluded ? ' (не учитывается)' : ''}`
      }
      placeholder={simple ? 'сухой' : 'сырой'}
      autoFocus={autoFocus && index === 0}
      value={ingredient.rawGrams}
      validate={positive}
      onValueChange={(rawGrams) => onChange(ingredient.id, rawGrams)}
      onEnter={() => focusOrBlur(null)}
    />
  ))
}
