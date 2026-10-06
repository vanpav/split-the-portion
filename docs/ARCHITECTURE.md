# Архитектура (MVP)

Статус: черновик на ревью · 2026-10-01. Продуктовые правила и формулы — в [SPEC.md](SPEC.md).

## 1. Принципы

1. **Храним ввод, вычисляем всё остальное.** В состоянии лежат только значения, которые ввёл пользователь. k, доли, остатки и сверка — это чистые функции от ввода, они не сохраняются.
2. **Расчёты только в `src/domain`.** Это чистый TypeScript без React, DOM и `localStorage`. У каждой функции есть тесты. Компоненты ничего не считают, они только вызывают домен и форматируют.
3. **Не пишем велосипеды.** Если задачу решает готовая библиотека или компонент shadcn/ui, берём их. Если кажется, что что-то нужно написать руками (роутер, хук, утилиту, UI-примитив), **сначала спрашиваем пользователя** и предлагаем варианты, а не пишем своё молча. Исключение — расчётная логика `src/domain`: это ядро продукта, его пишем сами и покрываем тестами.
4. **Mobile first.** Вёрстка начинается с одной колонки 375 px.

## 2. Стек и зависимости

Уже в шаблоне: Vite 8, React 19, TypeScript 6, oxlint, pnpm.

**Утверждённые решения:**
- **Библиотека компонентов — [shadcn/ui](https://ui.shadcn.com).** Все UI-примитивы (кнопки, поля, переключатели, выпадающие списки, диалоги, тосты) берём из неё. Компоненты копируются в проект CLI-командой `pnpm dlx shadcn@latest add <component>` и лежат в `src/components/ui`. Своё пишем только как композицию поверх них.
- **State management — [Zustand](https://zustand.docs.pmnd.rs)** с middleware `persist` (версия схемы и миграции из коробки); хранилище — IndexedDB через `idb-keyval` (§5.2).
- **Роутер — [React Router](https://reactrouter.com) v8** в hash-режиме (`createHashRouter` + `RouterProvider`).
- **Id — [nanoid](https://github.com/ai/nanoid).**

| Добавляем | Тип | Зачем |
|---|---|---|
| `vitest` | dev | Тесты домена и миграций; конфиг общий с Vite. Обязателен по ТЗ |
| `zustand` | prod | Глобальное состояние + `persist` с `version` и `migrate` |
| `react-router` (v8) | prod | Маршрутизация, `createHashRouter` — hash-маршруты работают на любом статическом хостинге |
| `idb-keyval` | prod | Хранилище `persist` в IndexedDB (≈ 600 Б): браузер может пометить его постоянным (`navigator.storage.persist`), места больше, чем в `localStorage`. Согласовано 2026-10-06 |
| `nanoid` | prod | Генерация id; в отличие от `crypto.randomUUID` работает и без secure context (телефон по http с LAN-адреса) |
| `tailwindcss`, `@tailwindcss/vite` | dev | Без Tailwind shadcn/ui не работает; стили пишем утилитарными классами |
| shadcn/ui (пресет `radix-nova`) и его зависимости: `radix-ui`, `class-variance-authority`, `cn` (официальная замена `clsx` + `tailwind-merge` от shadcn), `lucide-react`, `tw-animate-css`, `@fontsource-variable/geist` (шрифт с кириллицей); `sonner` + `next-themes` — приходят с `shadcn add sonner` | prod | Ставятся через `shadcn init` / `shadcn add`. Radix даёт доступность (фокус, клавиатура, ARIA), lucide — иконки, sonner — тосты |
| `shadcn` | dev | CLI и MCP-сервер shadcn (`.mcp.json`); из него же импортируется `shadcn/tailwind.css` |

Для shadcn нужен алиас `@/` → `src/` в `tsconfig.app.json` и `vite.config.ts`. Его настраивает `shadcn init`, но на этапе 01 нужно проверить, что CLI совместим с Vite 8 и TypeScript 6.

**Не добавляем (пока):**
- **Testing Library / e2e.** UI в MVP проверяем вручную по чек-листу (см. CLAUDE.md). Если UI-логика начнёт ломаться, это первый кандидат на добавление.
- **Библиотека для decimal.** Точности double хватает для граммов; округление только при выводе.

**Открытые вопросы по зависимостям** — в §8. Решаются с пользователем до начала соответствующего этапа.

## 3. Модель данных

```ts
// src/domain/types.ts
type Id = string;

interface Tare {
  id: Id;
  name: string;          // «Кастрюля 3 л»
  grams: number;         // вес тары
}

interface Ingredient {
  id: Id;
  name: string;
  rawGrams: number | null;   // null — ещё не введено
  excluded: boolean;         // «не учитывать»: вода, соль, специи
}

// Взвешивание: ввод готового веса. Снимок тары защищает старые расчёты от правок библиотеки.
type Weighing =
  | { id: Id; at: string; kind: 'food'; grams: number | null }
  | {
      id: Id; at: string; kind: 'withTare';
      grams: number | null;           // вес с тарой
      tare: { id: Id | null; name: string; grams: number }; // снимок
    };

// Порция: ввод в готовом весе или в сыром весе конкретного учитываемого ингредиента.
type PortionInput =
  | { basis: 'default'; grams: null }           // единицы не выбраны: следует за блюдом (с v2)
  | { basis: 'cooked'; grams: number | null }
  | { basis: 'raw'; ingredientId: Id; grams: number | null }
  | { basis: 'share'; weight: number }          // человек из компании: делит то, что осталось после порций в граммах (с v4)
  | { basis: 'part'; percent: number };         // своя порция в процентах блюда этапа: «мне 50 %»

interface Portion {
  id: Id;
  name: string;          // «Аня», «Контейнер 1»
  weighingId: Id;        // этап, на котором взята порция
  input: PortionInput;
}

type CookingKind = 'simple' | 'composite';

// Компания: кто ест вместе и в каком соотношении (с v4, заменила «состав по умолчанию»).
interface Company {
  id: Id;
  name: string;                                        // «Ваня и Ксюша»
  members: { id: Id; name: string; weight: number }[]; // доля — любое положительное число, важно соотношение
}

// Блюдо (рецепт): настраивается заранее, сохраняется кнопкой «Создать» / «Сохранить» (с v4).
interface Dish {
  id: Id;
  kind: CookingKind;     // simple — один продукт
  name: string;
  createdAt: string;
  updatedAt: string;
  ingredients: Ingredient[]; // rawGrams — обычный вес, подставляется в каждую готовку
  tareId: Id | null;         // тара по умолчанию из библиотеки; кто ест — в калькуляторе (companyId убран в v6)
}

// Готовка: одна варка блюда. Создаётся из черновика калькулятора (saveCooking), копирует ингредиенты.
interface Cooking {
  id: Id;
  dishId: Id;
  kind: CookingKind;
  title: string;         // название блюда на момент готовки
  createdAt: string;     // ISO
  updatedAt: string;
  ingredients: Ingredient[]; // копия из блюда, сегодняшний сырой вес правится здесь
  weighings: Weighing[]; // всегда ≥ 1: [0] — после готовки (создаётся пустым вместе с готовкой), [1..] — перевзвешивания остатка
  portions: Portion[];
  equalSplitN: number | null; // последнее N в «Разделить на N»
  keepPercent: number | null; // «На завтра»: % блюда, отложенный до дележа по долям (SPEC §5); v7
  companyId: Id | null;  // выбранная сегодня компания
}
```

Связи: `Dish 1—N Cooking` (через `dishId`), `Dish —0..1→ Tare`, `Dish —0..1→ Company`, `Cooking 1—N Ingredient` (копия), `Cooking 1—N Weighing`, `Weighing 1—N Portion` (через `weighingId`), `Weighing —snapshot→ Tare`, `Portion —0..1→ Ingredient` (если `basis: 'raw'`).

Почему этап привязан к взвешиванию, а не к дате: перевзвешивание и есть граница этапа. Новые порции всегда создаются на последнем взвешивании.

## 4. Расчётный модуль `src/domain`

Чистые функции без побочных эффектов. На входе — типы из §3, на выходе — плоские объекты результата с полной точностью.

```
src/domain/
  types.ts          — типы §3 и типы результатов
  numbers.ts        — parseGrams(), formatGrams(), formatK(), formatPercent(), roundHalfUp()
  weighing.ts       — foodGrams(weighing) → { ok, grams } | { ok:false, error:'tareExceeds'|'empty' }
  cooking.ts        — computeCooking(cooking) → CookingResult (этапы, доли, остатки, k)
  reconcile.ts      — reconcilePhase(phase) → { basis, distributed, total, diff, status }
  remainder.ts      — fillRemainder(result, portionId) → граммы в единицах строки
  split.ts          — splitEqual(totalGrams, n) → number[] (наибольший остаток)
  copyText.ts       — portionCopyText(result, portionId) → string
  phases.ts         — canReweigh(result), leftoverCookedGrams(result)
  dish.ts           — dishTitle, dishErrors, dishSource, shareWeights, defaultShareWeight
  keypad.ts         — applyKey (ввод с клавиатуры калькулятора), keypadKeyFromKeyboard
  presets.ts        — PRESET_DISHES (популярные блюда) и presetDishes(existing, newId, at)
  draft.ts          — cookingDraft(dish, input, at): готовка калькулятора, не хранится
  dates.ts          — dayLabel(at, now) → «сегодня» / «вчера» / «12 окт.»
  validation.ts     — warnings(cooking, result) → Warning[]
  index.ts          — публичный API
  __tests__/
    examples.test.ts  — эталонные примеры SPEC §11
    numbers.test.ts
    split.test.ts
    cooking.test.ts   — граничные случаи SPEC §8
    phases.test.ts    — перевзвешивание (кнопка, остаток в списке, составное блюдо), dayLabel
    share.test.ts     — порции по доле (70 : 60, порция в граммах + доли, без готового веса)
    presets.test.ts   — популярные блюда валидны для модели, повторно не добавляются
    dish.test.ts      — проверка блюда перед сохранением, «Из простого блюда», доля нового человека
```

### Основные типы результата

Полные определения — в `src/domain/types.ts`. Коротко:

- `CookingResult` — `baseIngredientId` (единственный учитываемый ингредиент или `null`), `countedIngredientIds`, `rawTotal` (Σ всех сырых весов, включая «не учитывать»), `phases`.
- `PhaseResult` — один этап: `available` (A_j), `foodGrams` (W_j или `null`), `weighingError` (`'empty' | 'tareExceeds' | null`), `k`, `portions`, `remainder` (`state: 'some' | 'none' | 'over'` с общим допуском `SHARE_EPSILON`, доля, готовый вес, сырой состав), `reconcile` (`null`, если сверять нечего: нет учитываемых ингредиентов, нет остатка, или составное блюдо без готового веса).
- `PortionResult` — `input` (ввод с разрешённым `basis: 'default'`: `computeCooking` — единственное место, где он разрешается), `share` (доля всего блюда или `null`), `cookedGrams`, `raw` (только учитываемые ингредиенты), `issue`: `'empty' | 'missingIngredient' | 'noCookedWeight' | 'nothingLeft'`.
- `Reconciliation` — `basis` (`'raw' | 'cooked'`), `distributed`, `total`, `diff`, `status`: `'ok' | 'over' | 'under' | 'incomplete'`.

Пока готовый вес не введён, у этапа `foodGrams = null`: сырые порции и сверка в сыром весе работают и до взвешивания.

### Публичные функции (`src/domain/index.ts`)

| Функция | Что делает |
|---|---|
| `parseGrams`, `formatGrams`, `formatK`, `formatPercent`, `roundHalfUp` | Ввод и вывод чисел (SPEC §6–7) |
| `foodGrams(weighing)` | Вес без тары или ошибка |
| `computeCooking(cooking)` | Все производные значения |
| `fillRemainder(cooking, result, portionId)` | Значение для кнопки «Остаток» или `null` (кнопку не показывать) |
| `splitEqual`, `splitLeftover(result, n)` | «Разделить на N» по остатку последнего этапа |
| `portionCopyText`, `rawAmountsCopyText` | Текст для трекера (SPEC §9) |
| `cookingWarnings(cooking, result)` | Предупреждения SPEC §8 |
| `isValidTareGrams(grams)` | Вес тары > 0 |
| `portionBasisOptions(result)`, `basisKey` | В каких единицах можно вводить порцию (по умолчанию — первым) |
| `convertPortionInput(result, portionId, basis)` | Та же порция в других единицах (при смене единиц на строке) |
| `isValidSplitN`, `MAX_SPLIT_PORTIONS` | N для «Разделить на N» |
| `ingredientDisplayName`, `ingredientNames`, `baseRawGrams` | Подписи ингредиентов, сырой вес базового ингредиента по id |
| `dishSource(dish)` | Название и обычный сырой вес простого блюда для составного на его основе |
| `dishTitle(dish)`, `dishErrors(dish)` | Название блюда; что мешает нажать «Создать» / «Сохранить» (нужен учитываемый продукт) |
| `dishKind(ingredients)` | Вид блюда по составу: один учитываемый продукт — простое |
| `shareWeights(portions)`, `defaultShareWeight(weights)` | Доля нового человека — среднее долей остальных |
| `matchingCompany(lineup, companies)`, `lineupName(lineup)` | Какой пресет совпадает с составом; имя нового пресета |
| `toPercents`, `percentShares`, `moveBoundary`, `nudgePercent`, `equalPercents`, `portionIn`, `keepAt`, `keepLimit` | Ползунок долей: целые проценты (и они же частями целого — для полосы компании в настройках), сдвиг границы, ±1 % с пропорциональным перераспределением, отсечение «на завтра» с правого края |
| `usualScaleGrams(cookings, dishId, tareId)` | Самый частый «Готовый» блюда с этой тарой — подстановка в калькулятор |
| `applyKey`, `keypadKeyFromKeyboard` | Ввод цифр в калькуляторе: запятая, ⌫, C, замена при первом нажатии |
| `presetDishes(existing, newId, at)`, `PRESET_DISHES` | Популярные блюда, которых ещё нет у пользователя (сравнение по названию без регистра); вид — по `dishKind`, без тары. Id и время передаются снаружи |
| `cookingDraft(dish, input, at)` | Черновик готовки из блюда и сегодняшних цифр; `computeCooking` считает по нему |
| `canReweigh(result)` | Активна ли «Перевзвесить остаток»: текущий этап взвешен и в кастрюле что-то есть |
| `leftoverCookedGrams(result)` | «остаток N г» в списке готовок; `null`, пока ничего не брали |
| `dayLabel(at, now)` | Подпись дня этапа; `now` передаётся снаружи, домен остаётся чистым |
| `defaultTitle`, `countedIngredients`, `findPortionPhase` | Вспомогательные |

### Правила для домена
- Функции не бросают исключений на пользовательском вводе. Ошибки возвращаются значениями (`issue`, `ok:false`).
- Никаких `Date.now()` и `Math.random()` внутри расчётов. Id и время генерирует слой состояния.
- Форматирование (`numbers.ts`) — тоже домен и тоже тестируется, потому что от него зависит, что видит пользователь.

## 5. Состояние и хранение

### 5.1. Стор

`src/store/store.ts` — один zustand-стор:

```ts
interface AppState {
  dishes: Dish[];
  cookings: Cooking[];
  tares: Tare[];
  companies: Company[];
  // блюда
  saveDish(draft): Id;            // «Создать» / «Сохранить» из редактора (черновик живёт в состоянии формы)
  deleteDish(id): void;           // вместе с готовками
  addDishes(dishes): void;        // «Добавить популярные блюда»: в конец списка, свои блюда не трогает
  // готовки
  saveCooking(draft): Id;         // «Сохранить» в калькуляторе: черновик (domain cookingDraft) под новыми id
  updateCooking(id, patch): void;
  deleteCooking(id): void;
  updateIngredient(cookingId, ingredientId, patch): void; // сегодняшний сырой вес
  setCookingCompany(cookingId, companyId): void;          // заменяет порции текущего этапа людьми компании
  setWeighing(cookingId, weighing): void;
  addReweighing(cookingId): Id;  // пустое взвешивание с режимом и тарой прошлого
  removeWeighing(cookingId, weighingId): void; // вместе с порциями этапа; первое не удаляется
  addPortion / updatePortion / removePortion
  restorePortion(cookingId, portion, index): void; // «Отменить» в тосте удаления
  // настройки
  upsertTare / deleteTare
  upsertCompany / deleteCompany   // удаление компании отвязывает её от блюд
  lineup: CompanyMember[] | null; setLineup(members) // «Сегодня едят» — общий состав калькулятора (с v5)
  holdMs: number; setHoldMs(ms)  // сколько держать «×», чтобы убрать человека; 0 — сразу (с v8)
}
```

Действия — тонкие иммутабельные обновления, без расчётов. Компоненты получают вычисленный результат через хук `useCookingResult(id)`, который мемоизирует `computeCooking(cooking)` по ссылке на объект готовки.

### 5.2. Хранение: IndexedDB и копия в файле

- Middleware `persist` от zustand, ключ `split-the-portion`, формат `{ state, version }`. Хранилище — IndexedDB (`idb-keyval`, база `keyval-store`), `src/store/idbStorage.ts`.
- Сохраняется только ввод пользователя: `storedData(state)` в `createAppStore.ts` — `dishes`, `cookings`, `tares`, `companies`, `lineup`, `holdMs`. Та же функция собирает копию в файл.
- Запись при каждом изменении. Объём маленький (десятки КБ), троттлинг не нужен.
- **Переезд из `localStorage`** (версии до 2026-10-06): если в IndexedDB ключа нет, читаем `localStorage`, сразу пишем в IndexedDB и только потом удаляем старую копию.
- **Чтение асинхронное.** `createAppStore` возвращает стор с `ready` — промисом, который выполняется, когда данные прочитаны (или признаны нечитаемыми и сохранены в резервную копию). `main.tsx` рендерит приложение после `ready`: иначе ввод до загрузки перезаписал бы данные.
- После загрузки просим `navigator.storage.persist()`: браузер не будет чистить данные при нехватке места. Отказ ничего не ломает.
- **Копия в файле** (Настройки → «Копия данных»): «Скачать» — JSON `{ app, version, exportedAt, state }` (`src/store/backupFile.ts`); «Загрузить» — файл любой прошлой версии проходит те же миграции (`readBackupFile`), после подтверждения заменяет данные (`replaceData`), тост «Отменить» возвращает прежние. Чужой, битый или более новый файл — тост «Файл не подошёл».

### 5.3. Версия схемы и миграции

- `src/store/migrations.ts`: `CURRENT_VERSION = 8` и массив чистых функций `migrations[n]: (stateVn) => stateVn+1`.
  - v1 → v2: пустые порции (`grams: null`) получают `basis: 'default'` — в v1 они и задумывались как «следуют за блюдом».
  - v2 → v3: у готовки появляется `kind`. Не больше одного ингредиента и он не «не учитывать» → `simple`, иначе `composite`.
  - v5 → v6: у блюд убран `companyId` — блюдо не привязано к людям.
  - v6 → v7: у готовок `keepPercent: null` — ничего не отложено «на завтра».
  - v7 → v8: `holdMs: 1500` — сколько держать «×», чтобы убрать человека (настройка).
  - v4 → v5: `lineup: null` — общий состав калькулятора ещё не выбран.
  - v3 → v4: блюда и компании. Старые готовки удаляются (согласовано: прототип, чистый лист), тара сохраняется, состав по умолчанию становится компанией «Обычно» с равными долями.
- `persist({ version: CURRENT_VERSION, migrate })`: `migrate` по очереди применяет шаги от сохранённой версии до текущей.
- **Снимок перед миграцией:** данные старой версии до миграции копируются в `split-the-portion:backup:v<N>:<ISO>` в том же хранилище — неудачный шаг не стоит данных.
- Любое изменение формы хранимых данных = новая версия + функция миграции + тест в `src/store/__tests__/migrations.test.ts` на фикстуре старой версии.
- Если данные не парсятся или миграция упала: сырую строку сохраняем в `split-the-portion:backup:<ISO>`, стартуем с пустым состоянием, показываем баннер «Не удалось прочитать сохранённые данные, копия сохранена». Реализация: ошибка приходит в `onRehydrateStorage` до первой записи; там делаем резервную копию. Флаг `loadError` ставится сразу после `create()`: синхронное восстановление идёт внутри `create()`, и состояние, выставленное в этот момент, затирается. Эта установка флага сразу записывает пустое состояние, поэтому при следующем запуске баннер не повторяется.
- Стор создаётся фабрикой `createAppStore(storage)` (`src/store/createAppStore.ts`); в приложении — `useAppStore` с IndexedDB (`src/store/store.ts`), в тестах — хранилище в памяти (синхронное и асинхронное).
- Сохранённая версия новее текущей (откат кода) → ведём себя так же, как при ошибке; резервная копия не перезаписывается.

### 5.4. Идентификаторы

`newId()` в `src/store/id.ts` — обёртка над `nanoid()`, чтобы источник id был в одном месте. `crypto.randomUUID()` не используем: он есть только в secure context, а на телефоне по `http://192.168.x.x:5173` его нет.

## 6. UI-слой

```
src/
  main.tsx
  index.css             — Tailwind + тема shadcn (CSS-переменные цветов, радиусы); свои токены — тоже здесь
  app/
    RootLayout.tsx      — оболочка: баннер ошибки чтения, <Outlet />, TabBar на экранах верхнего уровня, <Toaster />
    TabBar.tsx          — нижнее меню: «Простые», «Составные», «Добавить» (форма блюда), «Настройки»; с lg — панель слева
    router.tsx          — createHashRouter: корневой layout (шапка, <Outlet />) + маршруты экранов
  screens/
    DishList/           — блюда на вкладках «Простые | Составные», «Готовить» в строке
    DishEditor/         — создание и правка блюда: DishEditorScreen пересоздаёт DishEditorForm при смене адреса; черновик в состоянии формы, «Создать» / «Сохранить»
      IngredientEditorRow.tsx, FromSimpleDishPicker.tsx
    Calculator/         — калькулятор блюда: DisplayRow, Keypad, PersonResult
    Dish/               — история готовок блюда, «Составное на основе», удаление
    Cooking/            — полный экран сохранённой готовки
      WeighingSection.tsx     — «Сегодня»: сырой вес (TodayFields) и взвешивания, режим и тара свёрнуты в строку
      PeopleSection.tsx       — компания, люди, «Подробнее» (сверка, кастрюля, «Разделить на N», перевзвешивание)
      PersonRow.tsx           — «Ваня — 168 г», по нажатию: имя, доля или своя порция, убрать
      TarePicker.tsx          — выбор тары и создание новой на месте
    Settings/           — справочник тары + компании (CompanyCard: полоса долей ShareSlider без «На завтра», «+ Имя»)
  components/
    ui/                 — компоненты shadcn (генерирует CLI, руками правим только при необходимости)
    NumberField.tsx     — поле граммов: shadcn Field + InputGroup + parseGrams (см. ниже)
    ScreenHeader.tsx    — шапка экрана: «← назад» (куда и подпись — пропсы), заголовок, действия экрана; настройки — в TabBar (каждый экран рендерит свою)
    CopyButton.tsx      — shadcn Button + Clipboard + тост
    HoldButton.tsx      — × удержанием: рамка закрашивается, отпустил раньше — ничего
    ShareSlider.tsx     — полоса долей: сегменты, ручки границ, «− Ваня +», «Поровну»; «На завтра» и «г | %» — необязательные пропсы (калькулятор, компании в настройках)
    AddPersonRow.tsx    — поле «+ Имя»: Enter — человек добавлен, поле готово для следующего
  lib/
    utils.ts            — cn() от shadcn
  store/
    store.ts, migrations.ts, id.ts, hooks.ts
    __tests__/migrations.test.ts
  domain/               — см. §4
```

### Какие компоненты shadcn для чего

| Место в UI | shadcn |
|---|---|
| Кнопки, «+ Ингредиент», «Остаток», «Копировать» | `Button` |
| Поля граммов, названий, имён | `Input`, `Label` |
| «Не учитывать» | `Checkbox` или `Switch` |
| «Без тары / С тарой» | `ToggleGroup` (или `Tabs`) |
| База порции «сырой / готовый / сырой: курица» | `Select` |
| Выбор тары + «+ Новая тара» | `Popover` + `Command` (combobox) |
| Секции экрана | Без карточек: `<section>` с заголовком `h2` и отступами, `Separator` между группами. Главная кнопка — `components/BottomBar` (на телефоне прилипает к низу, с `lg` — обычная строка) |
| Строки списка готовок | `Item` (ссылка растянута на всю строку, кнопка удаления поверх) |
| Подпись + поле + ошибка | `Field`, `FieldLabel`, `FieldError` |
| Суффикс «г» в поле | `InputGroup` + `InputGroupAddon` |
| Пустой список | `Empty` |
| Плашка сверки, баннер ошибки чтения, подсказки | `Alert` (варианты default / destructive / `warning` — добавлен в `alert.tsx` через `cva`) |
| «Скопировано», «Удалено · Отменить» | `Sonner` (toast с action) |
| Подтверждение удаления готовки | `AlertDialog` |
| Запасной показ текста для копирования | `Dialog` + `Textarea` |
| Свёрнутые прошлые этапы, состав порции | `Collapsible` |
| Шапка, переход в настройки | `Button` variant `ghost` + иконки `lucide-react` |

Если нужного компонента нет в shadcn — сначала ищем в экосистеме shadcn/Radix, потом спрашиваем пользователя.

### NumberField
- Обёртка над shadcn `Input`: `type="text" inputMode="decimal" enterKeyHint="next"`, шрифт ≥ 16 px (`text-base`), высота ≥ 44 px (`h-11`).
- Черновик-строка живёт только пока поле в фокусе. На каждое изменение вызывается `parseGrams` из домена: если число валидно — `number` уходит в стор, если нет — под полем ошибка (`FieldError`), текст **не стирается**, в стор ничего не пишется. Пустая строка отдаётся как `null`.
- Вне фокуса поле показывает значение из стора через `formatInput` (домен: запятая, до 1 знака). Так поле само подхватывает внешние изменения (кнопка «Остаток»), без эффектов синхронизации. После ухода из поля с ошибочным текстом показывается последнее валидное значение.
- Суффикс «г» визуально внутри поля.
- `onEnter` — колбэк на Enter (переход к следующей строке ингредиентов).
- Необязательный `validate(value) → сообщение | null`: дополнительное правило (например, вес тары > 0). Сообщение показывается под полем, значение в стор не уходит.
- Если после сохранения поле нужно очистить, пока оно в фокусе (форма добавления), его пересоздают через `key`: в фокусе поле показывает свой черновик, а не значение из стора.
- Разбор числа — доменная логика (SPEC §7), поэтому он свой и с тестами. Обёртка над `Input` — композиция, а не велосипед.

### Стили и адаптивность
- Tailwind-классы прямо в JSX, `cn()` для условных классов. Отдельных CSS-файлов на компонент нет.
- Цвета — только через переменные темы shadcn (`bg-background`, `text-destructive` …). Для статуса «предупреждение» добавляем переменную `--warning` в `index.css`.
- Одна колонка до `lg` (1024 px): секции идут друг под другом «Ингредиенты → После готовки → Порции».
- От `lg` — две колонки (`lg:grid-cols-2`): слева ввод («Ингредиенты», «После готовки»), справа «Порции» и итоги (`lg:sticky`). Ширина контента ≤ 1200 px.
- Цвета состояний: ok — нейтральный, предупреждение — жёлтый, ошибка/перебор — `destructive`. Состояние дублируется текстом, а не только цветом.
- Минимальная высота интерактивных элементов — 44 px: в `components/ui` подняты размеры по умолчанию у `button`, `input`, `input-group`, `toggle`, поля поиска и пунктов `command`. При `shadcn add` CLI спрашивает про перезапись изменённых файлов — отвечать «нет».

### Маршруты
| Hash | Экран |
|---|---|
| `#/` | Список блюд; `?kind=composite` — вкладка «Составные» |
| `#/d/new[?from=…]` | Новое блюдо (одна форма, вид по составу); `from` — простое блюдо, на основе которого составное |
| `#/d/:id` | Калькулятор блюда (CalculatorScreen пересоздаёт Calculator при смене блюда) |
| `#/d/:id/history` | История готовок блюда, «Составное на основе», удаление |
| `#/d/:id/edit` | Правка блюда |
| `#/c/:id` | Экран готовки (несуществующий id → `<Navigate to="/" />`) |
| `#/settings` | Тара и компании |

Hash-маршруты выбраны потому, что работают на любом статическом хостинге без настройки сервера. Неизвестный путь → `errorElement` / `*` с редиректом на список. Навигация — `<Link>` и `useNavigate()`, параметр — `useParams()`.

## 7. Сборка и проверка

- `pnpm test` → `vitest run`; `pnpm test:watch` → `vitest`.
- Конфиг Vitest — в `vite.config.ts` (`test: { environment: 'node' }`). Домену DOM не нужен.
- `pnpm build` = `tsc -b && vite build`: должен проходить без ошибок типов.
- `pnpm lint` = oxlint.
- Для проверки на телефоне: `pnpm dev --host`, открыть адрес из локальной сети. Помнить: у `localhost` и у LAN-адреса разные origin, поэтому и разные хранилища; перенести данные — «Копия данных» в настройках.
- После `shadcn add` проверить, что сгенерированный код проходит `pnpm lint` и `pnpm build`.

## 8. Открытые вопросы (решить с пользователем)

По правилу «не пишем велосипеды» всё, что пришлось бы писать руками, выносим сюда.

Решено (2026-10-01): роутер — React Router (на момент установки — v8), id — nanoid (см. §2).

1. **Wake Lock** (бэклог P1): `react-screen-wake-lock` / `@uidotdev/usehooks` или свой хук. Решить, когда дойдём.
2. **PWA** (бэклог P1): `vite-plugin-pwa`. Решить, когда дойдём.
