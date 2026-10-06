import { XIcon } from 'lucide-react'
import { useRef } from 'react'
import { NumberField } from '@/components/NumberField'
import { SwipeRow, type SwipeRowHandle } from '@/components/SwipeRow'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Ingredient } from '@/domain'
import { focusOrBlur, ingredientGramsId, ingredientNameId } from '@/lib/domIds'

interface IngredientEditorRowProps {
  ingredient: Ingredient
  index: number
  autoFocus: boolean
  onChange: (patch: Partial<Omit<Ingredient, 'id'>>) => void
  onRemove: () => void
  onEnter: () => void
  placeholder?: string
}

/** Ingredient in the dish editor: name, usual raw weight, «не учитывать». On a touch screen × gives way to a swipe left. */
export function IngredientEditorRow({
  ingredient,
  index,
  autoFocus,
  onChange,
  onRemove,
  onEnter,
  placeholder = 'Курица',
}: IngredientEditorRowProps) {
  const label = ingredient.name.trim() || `ингредиент ${index + 1}`
  const excludedId = `ingredient-excluded-${ingredient.id}`
  const rowRef = useRef<SwipeRowHandle>(null)

  return (
    // An item of the ingredient list: it folds up when removed, the padding is part of it.
    <SwipeRow ref={rowRef} itemId={ingredient.id} className="flex flex-col gap-1.5 py-3" onRemove={onRemove}>
      <div className="flex items-start gap-2">
        <Input
          id={ingredientNameId(ingredient.id)}
          aria-label={`Название, ингредиент ${index + 1}`}
          placeholder={placeholder}
          enterKeyHint="next"
          autoFocus={autoFocus}
          value={ingredient.name}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            focusOrBlur(ingredientGramsId(ingredient.id))
          }}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <NumberField
          className="w-28 shrink-0"
          id={ingredientGramsId(ingredient.id)}
          ariaLabel={`Обычный сырой вес, ${label}`}
          placeholder="вес"
          value={ingredient.rawGrams}
          validate={(v) => (v !== null && v <= 0 ? 'Больше 0' : null)}
          onValueChange={(rawGrams) => onChange({ rawGrams })}
          onEnter={onEnter}
        />
        <Button
          variant="ghost"
          size="icon"
          className="pointer-coarse:sr-only"
          aria-label={`Удалить ${label}`}
          onClick={() => rowRef.current?.remove()}
        >
          <XIcon />
        </Button>
      </div>
      <Field orientation="horizontal" className="w-auto">
        <Checkbox
          id={excludedId}
          // 44 px hit area around the 16 px box.
          className="relative after:absolute after:-inset-3.5"
          checked={ingredient.excluded}
          onCheckedChange={(checked) => onChange({ excluded: checked === true })}
        />
        <FieldLabel htmlFor={excludedId} className="min-h-11 font-normal text-muted-foreground">
          не учитывать
        </FieldLabel>
      </Field>
    </SwipeRow>
  )
}
