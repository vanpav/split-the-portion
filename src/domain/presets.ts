import { dishKind, dishTitle } from './dish'
import type { Dish, Id } from './types'

/** A recipe template: no ids, no dates. `excluded` — «не учитывать» (water, salt, spices). */
export interface PresetIngredient {
  name: string
  rawGrams: number | null
  excluded?: boolean
}

export interface PresetDish {
  name: string
  ingredients: PresetIngredient[]
}

const water = (grams: number): PresetIngredient => ({ name: 'Вода', rawGrams: grams, excluded: true })
const salt = (grams: number): PresetIngredient => ({ name: 'Соль', rawGrams: grams, excluded: true })
const spices = (grams: number): PresetIngredient => ({ name: 'Специи', rawGrams: grams, excluded: true })

/**
 * Popular dishes for a new user (Settings → «Популярные блюда»). Usual raw weights for a pot for two
 * or three, taken from common Russian recipes (povar.ru, gastronom.ru, 1000.menu, menunedeli.ru).
 * Some have water, salt or spices marked «не учитывать», some have no weight yet (typed at cooking).
 */
export const PRESET_DISHES: PresetDish[] = [
  // ---- Simple: one counted product ----
  { name: 'Гречка', ingredients: [{ name: 'Гречка', rawGrams: 200 }] },
  { name: 'Рис', ingredients: [{ name: 'Рис', rawGrams: 180 }, water(400), salt(5)] },
  { name: 'Рис бурый', ingredients: [{ name: 'Рис бурый', rawGrams: 160 }] },
  { name: 'Булгур', ingredients: [{ name: 'Булгур', rawGrams: 150 }, water(300)] },
  { name: 'Перловка', ingredients: [{ name: 'Перловка', rawGrams: 150 }] },
  { name: 'Пшено', ingredients: [{ name: 'Пшено', rawGrams: 150 }, salt(3)] },
  { name: 'Овсянка на воде', ingredients: [{ name: 'Овсяные хлопья', rawGrams: 80 }, water(250), salt(2)] },
  { name: 'Кускус', ingredients: [{ name: 'Кускус', rawGrams: 150 }, water(200)] },
  { name: 'Киноа', ingredients: [{ name: 'Киноа', rawGrams: 120 }] },
  { name: 'Макароны', ingredients: [{ name: 'Макароны', rawGrams: 250 }, salt(10)] },
  { name: 'Спагетти', ingredients: [{ name: 'Спагетти', rawGrams: 200 }] },
  { name: 'Чечевица красная', ingredients: [{ name: 'Чечевица красная', rawGrams: 150 }, water(450)] },
  { name: 'Нут', ingredients: [{ name: 'Нут', rawGrams: 200 }] },
  { name: 'Фасоль красная', ingredients: [{ name: 'Фасоль красная', rawGrams: 200 }] },
  { name: 'Картофель отварной', ingredients: [{ name: 'Картофель', rawGrams: 800 }, salt(10)] },
  { name: 'Картофель запечённый', ingredients: [{ name: 'Картофель', rawGrams: 700 }] },
  { name: 'Батат запечённый', ingredients: [{ name: 'Батат', rawGrams: 500 }] },
  { name: 'Куриная грудка', ingredients: [{ name: 'Куриное филе', rawGrams: 500 }, spices(5)] },
  { name: 'Куриные бёдра', ingredients: [{ name: 'Куриное бедро без кости', rawGrams: 600 }] },
  { name: 'Индейка', ingredients: [{ name: 'Филе индейки', rawGrams: 500 }] },
  { name: 'Говядина отварная', ingredients: [{ name: 'Говядина', rawGrams: 700 }, water(2000), salt(10)] },
  { name: 'Свиная шея запечённая', ingredients: [{ name: 'Свиная шея', rawGrams: 800 }, spices(10)] },
  { name: 'Лосось запечённый', ingredients: [{ name: 'Лосось', rawGrams: 400 }] },
  { name: 'Треска', ingredients: [{ name: 'Треска', rawGrams: 500 }] },
  { name: 'Минтай', ingredients: [{ name: 'Минтай', rawGrams: 500 }] },
  { name: 'Креветки', ingredients: [{ name: 'Креветки', rawGrams: 300 }] },
  { name: 'Яйца варёные', ingredients: [{ name: 'Яйца', rawGrams: 300 }] },
  { name: 'Брокколи', ingredients: [{ name: 'Брокколи', rawGrams: 400 }] },
  { name: 'Цветная капуста', ingredients: [{ name: 'Цветная капуста', rawGrams: 500 }] },
  { name: 'Кабачки на гриле', ingredients: [{ name: 'Кабачки', rawGrams: 600 }] },
  { name: 'Свёкла запечённая', ingredients: [{ name: 'Свёкла', rawGrams: 500 }] },
  { name: 'Шампиньоны', ingredients: [{ name: 'Шампиньоны', rawGrams: null }] },

  // ---- Composite: two or more counted ingredients ----
  {
    name: 'Борщ',
    ingredients: [
      { name: 'Говядина', rawGrams: 600 },
      { name: 'Свёкла', rawGrams: 400 },
      { name: 'Капуста белокочанная', rawGrams: 400 },
      { name: 'Картофель', rawGrams: 400 },
      { name: 'Морковь', rawGrams: 150 },
      { name: 'Лук репчатый', rawGrams: 150 },
      { name: 'Томатная паста', rawGrams: 40 },
      { name: 'Масло подсолнечное', rawGrams: 30 },
      water(3000),
      salt(20),
    ],
  },
  {
    name: 'Щи из свежей капусты',
    ingredients: [
      { name: 'Свинина', rawGrams: 500 },
      { name: 'Капуста белокочанная', rawGrams: 500 },
      { name: 'Картофель', rawGrams: 300 },
      { name: 'Морковь', rawGrams: 100 },
      { name: 'Лук репчатый', rawGrams: 100 },
      water(2500),
      salt(15),
    ],
  },
  {
    name: 'Куриный суп с лапшой',
    ingredients: [
      { name: 'Куриное бедро', rawGrams: 500 },
      { name: 'Лапша', rawGrams: 100 },
      { name: 'Картофель', rawGrams: 300 },
      { name: 'Морковь', rawGrams: 100 },
      { name: 'Лук репчатый', rawGrams: 80 },
      water(2500),
      salt(15),
    ],
  },
  {
    name: 'Гороховый суп',
    ingredients: [
      { name: 'Горох колотый', rawGrams: 250 },
      { name: 'Копчёные рёбрышки', rawGrams: 400 },
      { name: 'Картофель', rawGrams: 300 },
      { name: 'Морковь', rawGrams: 100 },
      { name: 'Лук репчатый', rawGrams: 100 },
      water(2500),
    ],
  },
  {
    name: 'Плов с курицей',
    ingredients: [
      { name: 'Рис', rawGrams: 400 },
      { name: 'Куриное филе', rawGrams: 800 },
      { name: 'Морковь', rawGrams: 250 },
      { name: 'Лук репчатый', rawGrams: 250 },
      { name: 'Масло подсолнечное', rawGrams: 90 },
      { name: 'Чеснок', rawGrams: 40 },
      water(600),
      spices(5),
      salt(10),
    ],
  },
  {
    name: 'Плов со свининой',
    ingredients: [
      { name: 'Рис', rawGrams: 500 },
      { name: 'Свинина', rawGrams: 700 },
      { name: 'Морковь', rawGrams: 500 },
      { name: 'Лук репчатый', rawGrams: 200 },
      { name: 'Масло подсолнечное', rawGrams: 100 },
    ],
  },
  {
    name: 'Макароны по-флотски',
    ingredients: [
      { name: 'Макароны', rawGrams: 250 },
      { name: 'Фарш говяжий', rawGrams: 400 },
      { name: 'Лук репчатый', rawGrams: 100 },
      { name: 'Масло подсолнечное', rawGrams: 20 },
      salt(5),
    ],
  },
  {
    name: 'Гуляш из говядины',
    ingredients: [
      { name: 'Говядина', rawGrams: 600 },
      { name: 'Лук репчатый', rawGrams: 150 },
      { name: 'Морковь', rawGrams: 100 },
      { name: 'Томатная паста', rawGrams: 50 },
      { name: 'Мука пшеничная', rawGrams: 20 },
      { name: 'Масло подсолнечное', rawGrams: 30 },
      water(400),
    ],
  },
  {
    name: 'Гречка с грибами',
    ingredients: [
      { name: 'Гречка', rawGrams: 200 },
      { name: 'Шампиньоны', rawGrams: 300 },
      { name: 'Лук репчатый', rawGrams: 100 },
      { name: 'Масло сливочное', rawGrams: 20 },
    ],
  },
  {
    name: 'Курица с рисом',
    ingredients: [
      { name: 'Рис', rawGrams: 200 },
      { name: 'Куриное филе', rawGrams: 400 },
      { name: 'Масло подсолнечное', rawGrams: 15 },
      water(450),
      salt(5),
    ],
  },
  {
    name: 'Омлет',
    ingredients: [
      { name: 'Яйца', rawGrams: 240 },
      { name: 'Молоко 2,5 %', rawGrams: 100 },
      { name: 'Масло сливочное', rawGrams: 10 },
      salt(2),
    ],
  },
  {
    name: 'Сырники',
    ingredients: [
      { name: 'Творог 5 %', rawGrams: 400 },
      { name: 'Яйца', rawGrams: 60 },
      { name: 'Мука пшеничная', rawGrams: 60 },
      { name: 'Сахар', rawGrams: 30 },
      { name: 'Масло подсолнечное', rawGrams: 30 },
    ],
  },
  {
    name: 'Творожная запеканка',
    ingredients: [
      { name: 'Творог 5 %', rawGrams: 500 },
      { name: 'Яйца', rawGrams: 120 },
      { name: 'Манка', rawGrams: 50 },
      { name: 'Сахар', rawGrams: 60 },
      { name: 'Сметана 15 %', rawGrams: 50 },
    ],
  },
  {
    name: 'Овсянка с бананом',
    ingredients: [
      { name: 'Овсяные хлопья', rawGrams: 80 },
      { name: 'Молоко 2,5 %', rawGrams: 200 },
      { name: 'Банан', rawGrams: 120 },
      water(100),
    ],
  },
  {
    name: 'Котлеты домашние',
    ingredients: [
      { name: 'Фарш свино-говяжий', rawGrams: 500 },
      { name: 'Лук репчатый', rawGrams: 100 },
      { name: 'Хлеб белый', rawGrams: 60 },
      { name: 'Яйца', rawGrams: 60 },
      { name: 'Масло подсолнечное', rawGrams: 40 },
      spices(5),
    ],
  },
  {
    name: 'Ленивые голубцы',
    ingredients: [
      { name: 'Фарш свино-говяжий', rawGrams: 500 },
      { name: 'Капуста белокочанная', rawGrams: 400 },
      { name: 'Рис', rawGrams: 100 },
      { name: 'Лук репчатый', rawGrams: 100 },
      { name: 'Морковь', rawGrams: 100 },
      { name: 'Сметана 15 %', rawGrams: 100 },
      { name: 'Томатная паста', rawGrams: 50 },
      water(300),
    ],
  },
  {
    name: 'Овощное рагу',
    ingredients: [
      { name: 'Кабачки', rawGrams: 400 },
      { name: 'Картофель', rawGrams: 400 },
      { name: 'Морковь', rawGrams: 150 },
      { name: 'Перец болгарский', rawGrams: 200 },
      { name: 'Лук репчатый', rawGrams: 100 },
      { name: 'Помидоры', rawGrams: 300 },
      { name: 'Масло подсолнечное', rawGrams: 30 },
    ],
  },
  {
    name: 'Тушёная капуста с курицей',
    ingredients: [
      { name: 'Капуста белокочанная', rawGrams: 800 },
      { name: 'Куриное бедро без кости', rawGrams: 500 },
      { name: 'Морковь', rawGrams: 150 },
      { name: 'Лук репчатый', rawGrams: 100 },
      { name: 'Томатная паста', rawGrams: 30 },
      { name: 'Масло подсолнечное', rawGrams: 30 },
      salt(8),
    ],
  },
  {
    name: 'Шакшука',
    ingredients: [
      { name: 'Яйца', rawGrams: 240 },
      { name: 'Помидоры', rawGrams: 500 },
      { name: 'Перец болгарский', rawGrams: 150 },
      { name: 'Лук репчатый', rawGrams: 80 },
      { name: 'Масло оливковое', rawGrams: 20 },
      spices(3),
    ],
  },
  {
    name: 'Чили кон карне',
    ingredients: [
      { name: 'Фарш говяжий', rawGrams: 500 },
      { name: 'Фасоль красная консервированная', rawGrams: 400 },
      { name: 'Помидоры в собственном соку', rawGrams: 400 },
      { name: 'Лук репчатый', rawGrams: 150 },
      { name: 'Перец болгарский', rawGrams: 150 },
      { name: 'Масло подсолнечное', rawGrams: 20 },
      spices(10),
    ],
  },
  {
    name: 'Паста болоньезе',
    ingredients: [
      { name: 'Спагетти', rawGrams: 300 },
      { name: 'Фарш говяжий', rawGrams: 400 },
      { name: 'Помидоры в собственном соку', rawGrams: 400 },
      { name: 'Лук репчатый', rawGrams: 100 },
      { name: 'Морковь', rawGrams: 80 },
      { name: 'Масло оливковое', rawGrams: 20 },
      { name: 'Пармезан', rawGrams: null },
    ],
  },
]

/** What a simple popular dish brings into a composite one: its first counted product and the usual raw weight; null for a composite. */
export function presetSource(preset: PresetDish): { name: string; rawGrams: number | null } | null {
  const counted = preset.ingredients.filter((i) => !i.excluded && i.name.trim())
  if (counted.length !== 1) return null
  return { name: counted[0].name.trim(), rawGrams: counted[0].rawGrams }
}

const key = (name: string) => name.trim().toLowerCase()

/** Popular dishes the user does not have yet: one with the same title (ignoring case) is theirs already. */
export function missingPresets(existing: Pick<Dish, 'name' | 'ingredients'>[]): PresetDish[] {
  const taken = new Set(existing.map((d) => key(dishTitle(d))))
  return PRESET_DISHES.filter((p) => !taken.has(key(p.name)))
}

/** One popular dish as the user's own: fresh ids, the given time, no tare, not weighed, not used yet, the kind by its recipe. */
export function presetDish(preset: PresetDish, newId: () => Id, at: string): Dish {
  const ingredients = preset.ingredients.map((i) => ({
    id: newId(),
    name: i.name,
    rawGrams: i.rawGrams,
    excluded: i.excluded ?? false,
  }))
  return { id: newId(), kind: dishKind(ingredients), name: preset.name, createdAt: at, updatedAt: at, ingredients, tareId: null, cooked: null, usedOn: [] }
}

/**
 * The popular dishes the user does not have yet, ready for the store: a dish whose title matches an
 * existing one (ignoring case) is skipped, so pressing the button twice adds nothing. Kind follows the
 * recipe (`dishKind`), no tare. Ids and the time come from outside to keep the domain pure.
 */
export function presetDishes(existing: Pick<Dish, 'name' | 'ingredients'>[], newId: () => Id, at: string): Dish[] {
  return missingPresets(existing).map((p) => presetDish(p, newId, at))
}
