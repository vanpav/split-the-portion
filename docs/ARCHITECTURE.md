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
| shadcn/ui (пресет `radix-nova`) и его зависимости: `radix-ui`, `class-variance-authority`, `cn` (официальная замена `clsx` + `tailwind-merge` от shadcn), `lucide-react`, `tw-animate-css`; `sonner` + `next-themes` — приходят с `shadcn add sonner` | prod | Ставятся через `shadcn init` / `shadcn add`. Radix даёт доступность (фокус, клавиатура, ARIA), lucide — иконки, sonner — тосты, `next-themes` — светлая/тёмная тема по настройке системы; `tw-animate-css` — анимации shadcn и переходы между экранами (`app/ScreenTransition.tsx`, без отдельной библиотеки анимаций) |
| `@fontsource-variable/rubik` | prod | Шрифт стиля «Ланчбокс» (DESIGN.md): кириллица, моноширинные цифры (`tnum`). Заменил Geist. Согласовано 2026-10-06 |
| `i18next`, `react-i18next`, `i18next-browser-languagedetector` | prod | Языки интерфейса (§11): тексты по ключам, плюралы через `Intl.PluralRules`, определение языка устройства. Согласовано 2026-10-07: стандарт де-факто, чистый JS — работает и в обёртке для App Store / Google Play (WebView), ≈ 20 КБ gzip |
| `shadcn` | dev | CLI и MCP-сервер shadcn (`.mcp.json`); из него же импортируется `shadcn/tailwind.css` |
| `vite-plugin-pwa` (v2, поддерживает Vite 8), `workbox-build` (его peer), `workbox-window` | dev, dev, prod | PWA (этап 11): манифест, Service Worker с precache всей сборки (Workbox), `useRegisterSW` для тоста «Есть новая версия». Свой Service Worker не пишем. Согласовано 2026-10-06 |
| `wrangler` | dev | CLI Cloudflare: D1, миграции, секреты, деплой, типы окружения (`pnpm wrangler types`), `getPlatformProxy` для `pnpm db:auth-schema` ([CLOUDFLARE.md](CLOUDFLARE.md)). Согласовано 2026-10-06 |
| `@cloudflare/vite-plugin` | dev | Воркер и локальная D1 внутри `pnpm dev` и `pnpm preview` — один dev-сервер на 5180; сборка воркера в `dist/split_the_portion`. Согласовано 2026-10-06 |
| `better-auth`, `@better-auth/passkey` | prod | Вход почта + пароль, passkey (WebAuthn), сессии и ограничение частоты в D1 (D1 — напрямую, с 1.5), группы — плагин `organization`. Под workerd хеш пароля сам берёт нативный `node:crypto` scrypt. Свою авторизацию не пишем: это безопасность. Согласовано 2026-10-06 |
| `hono` | prod (воркер) | Маршруты `/api/*` и `csrf()` в воркере. Согласовано 2026-10-06 |
| `@vite-pwa/assets-generator` | dev | `pnpm icons`: иконки PWA, `apple-touch-icon` и `favicon.ico` из `public/favicon.svg` (`pwa-assets.config.ts`); PNG коммитятся. Согласовано 2026-10-06 |
| `driver.js` | prod | Подсказки для новых (этап 18): тур по калькулятору — затемнение с вырезом вокруг элемента, карточка у края экрана, прокрутка к элементу, Esc и ← / →, возврат фокуса после тура (`src/onboarding/useCalculatorTour.ts`). MIT, без зависимостей. Карточка не из shadcn — исключение, как `sonner`: оформлена переменными темы (`.hint-popover` в `index.css`). React Joyride (тяжелее), Shepherd.js и Intro.js (AGPL-3.0) не взяли. Согласовано 2026-10-07 |
| `react-easy-crop` | prod | Экран «Фото» (Настройки → Аккаунт): перетаскивание и масштаб пальцами, колёсиком и ползунком, круглое окно; отдаёт выбранный квадрат в пикселях снимка, а вырезает и уменьшает до 256×256 JPEG `src/account/cropImage.ts` (canvas). В shadcn/ui кадрирования нет. Согласовано 2026-10-07 |
| `@use-gesture/react` | prod | Свайп строк на сенсорном экране (`components/SwipeRow`, хук `useDrag`: `axis: 'x'`, отмена при вертикальной прокрутке, скорость для «смахнуть»). В shadcn/ui такого компонента нет; распознавание жестов руками не пишем. Согласовано 2026-10-06 (#27) |

Для shadcn нужен алиас `@/` → `src/` в `tsconfig.app.json` и `vite.config.ts`. Его настраивает `shadcn init`, но на этапе 01 нужно проверить, что CLI совместим с Vite 8 и TypeScript 6.

**Не подошло:** `@cloudflare/vitest-pool-workers` (этап 13) требует Vitest 4. Тесты воркера идут на настоящей локальной D1 через `getPlatformProxy` из `wrangler` (`worker/__tests__/localD1.ts`), новой зависимости не нужно.

**Распознавание речи — свой хук** `lib/useSpeechRecognition.ts` поверх Web Speech API браузера (микрофон в редакторе блюда, этап 19): ~100 строк, типы API описаны в нём же (в DOM-типах TypeScript их нет), без новой зависимости. Готовые обёртки (`react-speech-recognition` и т. п.) тянут полифилы и облачные сервисы, а нам нужны старт, стоп, живой текст и три ошибки. Согласовано с пользователем 2026-10-07. Распознавание на своём сервере — в бэклог, если браузер не справится.

**Синхронизация — своя** (`src/sync`, §10), а не готовый движок (Firebase, Dexie Cloud, Replicache, PowerSync). Готовые движки заменяют Zustand persist своим хранилищем или тянут вторую систему. Нам нужны ~300 строк чистых функций с тестами поверх уже работающих стора, миграций и IndexedDB. Согласовано 2026-10-06.

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
  createdAt: string;     // порядок в списках на всех устройствах (с v10, этап 13)
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
  createdAt: string;                                   // порядок: первая компания — состав блюда по умолчанию (с v10, этап 13)
  members: { id: Id; name: string; weight: number }[]; // доля — любое положительное число, важно соотношение
}

// Состав «Кто ест» у блюда (с v9): выбранная компания — шаблон, правится только состав.
interface Lineup {
  companyId: Id | null;    // выбранная компания; null — не выбрана (удалена или состав из v8)
  members: CompanyMember[]; // люди и доли этого блюда после ползунка, «+ Имя», ×
}

// Блюдо (пресет): создаётся кнопкой «Создать», дальше запоминает ввод калькулятора (этап 15).
interface Dish {
  id: Id;
  kind: CookingKind;     // simple — один продукт
  name: string;
  // Категория, выбранная вручную в редакторе (с v13); null — «по названию»: определяется по названию
  // (detectCategory) и не хранится. Синхронизируется с блюдом. Значения — DishCategory (SPEC §3б).
  category: DishCategory | null;
  createdAt: string;
  updatedAt: string;     // создание, «Сохранить», ввод сырого веса, тары, готового веса — порядок полки (UX §3); синхронизируется с блюдом
  ingredients: Ingredient[]; // rawGrams — последний введённый сырой вес
  tareId: Id | null;         // тара, в которой взвешивают; кто ест — lineups (companyId убран в v6)
  // Последний готовый вес (с v11): вес на весах, тара, при которой взвешено, и время.
  // Показывается, только если сегодня и тара та же (cookedToday); null — не взвешивали.
  cooked: { grams: number; tareId: Id | null; at: string } | null;
  // Дни использования (с v12): «YYYY-MM-DD» по местному времени, когда в калькуляторе вводили сырой вес,
  // тару или готовый вес; по возрастанию, без повторов, последние 30. Для «Частых» в меню блюд (SPEC §3б).
  // Правка в редакторе не считается. Синхронизируется с блюдом.
  usedOn: string[];
}

// Готовка: одна варка блюда — черновик калькулятора (cookingDraft), вход computeCooking.
// С v11 не хранится: в сторе и в синхронизации готовок нет.
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

Связи хранимых данных: `Dish —0..1→ Tare`, `Dish —0..1→ Lineup` (`lineups[dishId]`), `Lineup —0..1→ Company`. В черновике расчёта: `Cooking 1—N Ingredient` (копия из блюда), `Cooking 1—N Weighing`, `Weighing 1—N Portion` (через `weighingId`), `Weighing —snapshot→ Tare`, `Portion —0..1→ Ingredient` (если `basis: 'raw'`).

**Группа и аккаунт** (этапы 12–14) в доменную модель не входят: расчёт о них не знает. Все данные выше принадлежат одной группе. Группы, участники и аккаунт живут на сервере (§9) и в кэше `src/store/account.ts`.

Почему этап привязан к взвешиванию, а не к дате: перевзвешивание и есть граница этапа. Новые порции всегда создаются на последнем взвешивании. С этапа 15 калькулятор строит черновик с одним взвешиванием; этапы остаются в домене и его тестах (пример 3 SPEC §11).

## 4. Расчётный модуль `src/domain`

Чистые функции без побочных эффектов. На входе — типы из §3, на выходе — плоские объекты результата с полной точностью.

```
src/domain/
  types.ts          — типы §3 и типы результатов
  numbers.ts        — parseGrams(), formatGrams(), formatK(), formatPercent(), formatTyped(), formatInput(), decimalSeparator(), roundHalfUp(); форматтеры принимают локаль (`ru-RU`, `en-US`)
  language.ts       — LANGUAGES (en, ru, es), Language, isLanguage()
  weighing.ts       — foodGrams(weighing) → { ok, grams } | { ok:false, error:'tareExceeds'|'empty' }
  cooking.ts        — computeCooking(cooking) → CookingResult (этапы, доли, остатки, k)
  reconcile.ts      — reconcilePhase(phase) → { basis, distributed, total, diff, status }
  remainder.ts      — fillRemainder(result, portionId) → граммы в единицах строки
  split.ts          — splitEqual(totalGrams, n) → number[] (наибольший остаток)
  swipe.ts          — settleSwipe (куда доехать строке после отпускания), rubberBand (сопротивление за краем), settleDuration — для components/SwipeRow
  portions.ts       — «Доли» (этапы 16–17): dishPortions, addPortion, removeLastPortion, DEFAULT_PORTIONS, splitSummary
  copyText.ts       — portionCopyLines(cooking, result, portionId) → { name, grams }[]; слова строки — в UI (§11)
  phases.ts         — canReweigh(result), leftoverCookedGrams(result)
  dish.ts           — dishTitle, dishErrors, dishSource, shareWeights, defaultShareWeight
  phrase.ts         — «Что в блюде» (этап 19): parsePhrase → PhraseItem[] с пометками, removePhraseItem, appendToPhrase, ingredientsToPhrase, phraseIngredients, phraseSummary
  speech.ts         — сказанное → фраза: spokenToPhrase (числа словами, единицы, паразиты), looksSpoken
  phraseLanguage.ts — PhraseLanguage: всё языковое для фразы (числа словами, единицы, словарь падежей, «не учитывать»); пока только RU
  phraseText.ts     — тексты разбора: phraseIssueText (пометки), phraseWeightText (вес в строке), phraseSummaryText (итог)
  keypad.ts         — typedGrams (что набрано в поле калькулятора), applyKey
  dishCategories.ts — DishCategory (тип — в types.ts), DISH_CATEGORIES (порядок показа), CATEGORY_LABELS (на всех языках интерфейса: поиск ищет по любому), словарь основ и detectCategory, dishCategory(dish), categoryMatches(query, category)
  presets.ts        — PRESET_DISHES (популярные блюда), presetDishes(existing, newId, at), presetWeight, scalePreset (вес под новый), pickedDishes (отмеченные с весом, в порядке отметки)
  lineup.ts         — companyLineup, dishLineup, lineupCompany: «Кто ест» у каждого блюда
  draft.ts          — cookingDraft(dish, input, at): готовка калькулятора, не хранится
  dates.ts          — shortDate(at, locale) → «7 окт.», clockTime(at, locale) → «19:40», sameDay, cookedToday
  validation.ts     — warnings(cooking, result) → Warning[]
  index.ts          — публичный API
  __tests__/
    examples.test.ts  — эталонные примеры SPEC §11
    numbers.test.ts
    split.test.ts
    cooking.test.ts   — граничные случаи SPEC §8
    phases.test.ts    — перевзвешивание (кнопка, остаток в списке, составное блюдо)
    share.test.ts     — порции по доле (70 : 60, порция в граммах + доли, без готового веса)
    presets.test.ts   — популярные блюда валидны для модели, повторно не добавляются; вес, масштаб рецепта, порядок отметки
    dish.test.ts      — проверка блюда перед сохранением, «Из блюда», доля нового человека
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
| `parseGrams`, `formatGrams`, `formatK`, `formatPercent`, `roundHalfUp` | Ввод и вывод чисел (SPEC §6–7); вывод — в локали, которую передал UI |
| `keypadText(value)` | Значение как набранный текст клавиатуры калькулятора: всегда с запятой, на экране — разделитель локали (`formatTyped`) |
| `foodGrams(weighing)` | Вес без тары или ошибка |
| `computeCooking(cooking)` | Все производные значения |
| `fillRemainder(cooking, result, portionId)`, `splitEqual`, `splitLeftover(result, n)`, `cookingWarnings`, `convertPortionInput`, `portionBasisOptions` | «Остаток», «Разделить на N», предупреждения, единицы порции — модель и тесты; экрана готовки, который их показывал, с этапа 15 нет |
| `portionCopyLines`, `rawAmountsCopyLines` | Строки для трекера (SPEC §9): имя и граммы; текст собирает `copyText` из `src/i18n/format.ts` |
| `cookingWarnings(cooking, result)` | Предупреждения SPEC §8 |
| `isValidTareGrams(grams)` | Вес тары > 0 |
| `portionBasisOptions(result)`, `basisKey` | В каких единицах можно вводить порцию (по умолчанию — первым) |
| `convertPortionInput(result, portionId, basis)` | Та же порция в других единицах (при смене единиц на строке) |
| `isValidSplitN`, `MAX_SPLIT_PORTIONS` | N для «Разделить на N»; предел числа порций в «Долях» |
| `dishPortions(stored, freshIds)`, `addPortion(list, id)`, `removeLastPortion(list)`, `DEFAULT_PORTIONS` | «Доли» (этап 16): порции блюда — сохранённые на устройстве или 2 равные (битый список — как пустой); «+» — порция со средней долей в конце, «−» — последняя (1…100). Делятся порции тем же расчётом, что люди (`cookingDraft`) |
| `splitSummary(values, digits)` | «по 80 г × 7» над сеткой «Долей» (этап 17): сколько порций делят по долям, одно значение, если все округляются до одного (граммы — до целого, проценты — до десятых), иначе наименьшее и наибольшее |
| `equalSplit(n)`, `isEqualSplit(weights)`, `exactPercents(parts)` | «Поровну» точно (100 / n каждому, не целые проценты), «уже поровну» по весам, части блюда в процентах без округления (минимум 1 %) — для `lineupPercents` и «Всё в доли» (этап 17) |
| `ingredientDisplayName`, `ingredientNames`, `baseRawGrams` | Подписи ингредиентов, сырой вес базового ингредиента по id |
| `dishSource(dish)` | Название и обычный сырой вес простого блюда для составного на его основе |
| `dishTitle(dish)`, `dishErrors(dish)` | Название блюда; что мешает нажать «Создать» / «Сохранить» (нужен учитываемый продукт) |
| `dishKind(ingredients)` | Вид блюда по составу: один учитываемый продукт — простое |
| `shareWeights(portions)`, `defaultShareWeight(weights)` | Доля нового человека — среднее долей остальных |
| `matchingCompany(lineup, companies)`, `lineupName(lineup, locale)` | Какой пресет совпадает с составом; имя нового пресета через `Intl.ListFormat` («Ваня, Ксюша и Тёща»); пусто — без имён |
| `companyLineup(company)`, `dishLineup(lineups, dishId, companies)`, `lineupCompany(lineup, companies)` | Состав блюда из компании (её доли по умолчанию); состав блюда в калькуляторе (свой или первая компания); какая компания показана в списке (выбранная, если она ещё есть, иначе совпадающая) |
| `toPercents`, `percentShares`, `moveBoundary`, `nudgePercent`, `equalPercents`, `portionIn`, `portionGrams`, `keepAt`, `keepLimit` | Ползунок долей: целые проценты (и они же частями целого — для полосы компании в настройках), сдвиг границы, ±1 % с пропорциональным перераспределением, отсечение «на завтра» с правого края; порция в граммах вида — готовых или сухого продукта k (`portionGrams`, `portionIn(computed, unit, rawOf)`) |
| `liveTareId(tareId, tares)` | Тара блюда, если она ещё есть в библиотеке, иначе `null` — «Без тары» (SPEC §8: тару удалили). Калькулятор и редактор читают тару блюда только через неё |
| `cookedToday(cooked, tareId, now)`, `clockTime(at)` | Последний готовый вес блюда, если он сегодняшний и в той же таре — подстановка в «Готовый»; время «19:40» к подписи (этап 15) |
| `lineupPercents(members, portions)` | Сегодняшние части блюда целыми процентами — доли состава после своей порции |
| `localDay(date)`, `markUsed(usedOn, day)`, `usesSince(usedOn, today)` | День «YYYY-MM-DD» по местному времени; отметка использования (раз в день, последние 30, `USED_DAYS_KEPT`); сколько разных дней за последние 60 (`FREQUENT_WINDOW_DAYS`). Дата передаётся снаружи |
| `popularView(query, filter, picked)` → `{ counts, sections }` | Экран «Популярные блюда» (UX §3г): разделы по категориям / один список по `matchRank` / «Отмечено» / одна категория; числа на чипах по найденному |
| `dishMenu(dishes, presets, { query, today, byCategory? })` → `{ often, rest, categories, popular }` (`byCategory`: свои блюда в `categories`, `often` и `rest` пусты), `dishPicks(dishes, presets, { query, today })`, `matchRank(query, title, products, category?)` (категория — ниже любого совпадения по названию и продукту), `detectCategory`, `dishCategory`, `categoryMatches`, `dishFoundByCategory`, `compareNames(a, b)`, `dishWeight`, `dishProducts`, `dishFoundBy`, `highlightRange` | Меню блюд (SPEC §3б): совпадение с запросом (название раньше продуктов, начало слова раньше середины; «ё» = «е»), разделы «Часто готовишь» (≥ 2 дней за 60, не больше 5) / «Остальные» (`Intl.Collator('ru')`) / популярные; список «Из блюда»; что показывает строка: вес, продукты, по какому продукту нашлось, подсветка |
| `recentDishes(dishes)`, `shelfOrder(dishes, order)`, `rawTile(ingredients)`, `asSimple(ingredients)` | Порядок по последнему использованию (последнее сверху); полка, пока открыта: порядок на момент открытия, новые блюда — в начало; плитка «Сырой» составного: сумма, сколько в счёте, без веса / не в счёт (слова — `rawTileLines` в `screens/Calculator/messages.ts`); «Простое» в редакторе |
| `typedGrams`, `applyKey` | Ввод в поле калькулятора: цифры и одна запятая (точка — тоже), до 99 999,9; остальное отбрасывается |
| `presetDishes(existing, newId, at)`, `missingPresets(existing)`, `presetDish(preset, newId, at)`, `PRESET_DISHES` | Популярные блюда, которых ещё нет у пользователя (сравнение по названию без регистра); одно популярное как своё; вид — по `dishKind`, без тары. Id и время передаются снаружи |
| `cookingDraft(dish, input, at)` | Черновик готовки из блюда и сегодняшних цифр; `computeCooking` считает по нему. Свои порции — в готовых граммах (`fixedCooked`), в сухом виде (`fixedRaw`, сырой вес продукта) или в процентах (`fixedPercent`) |
| `canReweigh(result)`, `leftoverCookedGrams(result)` | Перевзвешивание и остаток этапа — в домене и тестах; в интерфейсе с этапа 15 не используются |
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
  tares: Tare[];
  companies: Company[];
  // блюда
  saveDish(draft, { used }?): Id; // «Создать» / «Сохранить» из редактора; калькулятор так же пишет сырой вес и тару с used: true — день попадает в usedOn (markUsed)
  setCooked(dishId, grams): void; // готовый вес из калькулятора: время и тару (через liveTareId) ставит стор; null — поле стёрто (с v11); отмечает день в usedOn
  deleteDish(id): void;           // вместе с его составом lineups
  addDishes(dishes): void;        // «Добавить популярные блюда», популярное из меню блюд: в конец списка
  // настройки
  upsertTare / deleteTare
  upsertCompany / deleteCompany   // удаление компании не трогает составы блюд: она просто не показана выбранной («Отменить» возвращает её)
  lineups: Record<Id, Lineup>; setLineup(dishId, lineup) // «Кто ест» у каждого блюда: выбранная компания и доли (с v9; удаление блюда убирает и его состав)
  holdMs: number; setHoldMs(ms)  // сколько держать «×», чтобы убрать человека; 0 — сразу (с v8)
}
```

Действия — тонкие иммутабельные обновления, без расчётов. Калькулятор собирает черновик (`cookingDraft`) из блюда и набранных чисел и считает `computeCooking(draft)` в `useMemo`; в стор черновик не попадает.

### 5.2. Хранение: IndexedDB и копия в файле

- Middleware `persist` от zustand, ключ `split-the-portion`, формат `{ state, version }`. Хранилище — IndexedDB (`idb-keyval`, база `keyval-store`), `src/store/idbStorage.ts`.
- Сохраняется только ввод пользователя: `storedData(state)` в `createAppStore.ts` — `dishes`, `tares`, `companies`, `lineups`, `holdMs` (готовок нет с v11). Та же функция собирает копию в файл.
- Запись при каждом изменении. Объём маленький (десятки КБ), троттлинг не нужен.
- **Переезд из `localStorage`** (версии до 2026-10-06): если в IndexedDB ключа нет, читаем `localStorage`, сразу пишем в IndexedDB и только потом удаляем старую копию.
- **Чтение асинхронное.** `createAppStore` возвращает стор с `ready` — промисом, который выполняется, когда данные прочитаны (или признаны нечитаемыми и сохранены в резервную копию). `main.tsx` рендерит приложение после `ready`: иначе ввод до загрузки перезаписал бы данные.
- После загрузки просим `navigator.storage.persist()`: браузер не будет чистить данные при нехватке места. Отказ ничего не ломает.
- **По группам (с этапа 13).** Без входа данные лежат под ключом `split-the-portion`, как раньше. После входа у каждой группы свой блоб `split-the-portion:group:<id>` в том же формате и с теми же миграциями. Рядом лежат неотправленные изменения и курсор: `split-the-portion:sync:<id>`. Аккаунт (кто вошёл, группы, группа по умолчанию) — отдельный стор `src/store/account.ts`, ключ `split-the-portion:account`. В копию данных он не попадает. Подробно — §10.
- **Настройки устройства** (этап 16) — отдельный стор `src/store/prefs.ts`, ключ `split-the-portion:prefs` в той же IndexedDB: `splitMode` (`'people' | 'shares'`, люди «Кто ест» или «Доли»), `composition` (переключатель «Состав», один на все блюда) и `portions` (порции блюда в «Долях» по id блюда: `PortionShare[]` — `{ id, weight }` без имён, номер — по месту). Как тема и аккаунт, они не входят в `storedData`: не синхронизируются (§10), не попадают в копию данных, не зависят от открытой группы и не трогаются выходом из аккаунта. Поэтому форма данных приложения и `CURRENT_VERSION` не меняются. У стора своя версия `PREFS_VERSION = 2` и миграция `migratePrefs` (`src/store/prefsMigrations.ts`, тест на фикстуре v1): v1 — `'portions'` и `portionCounts` (N равных порций) первой версии этапа 16 → v2 — `'shares'` и N порций с долей 1. `main.tsx` ждёт `prefsReady`, как `accountReady`.
- **Последний калькулятор** — стор `src/store/lastCalculator.ts`, ключ `split-the-portion:calculator`, на устройстве, как настройки: id блюда, открытого в калькуляторе последним, время и ввод калькулятора — тексты полей, «Готовый» тронут, строка «Сухой» / «Сырой» / «Готовый», свои порции (граммы; `raw` — в каком виде введены), «На завтра». Пишется на каждое изменение (сбой ничего не теряет), только калькулятором — другие экраны не запоминаются. `#/` открывает это блюдо (`startDish`; удалено — последнее использованное). Первый калькулятор после запуска берёт ввод обратно, если он того же дня (`sameDay`) и того же блюда; при переключении блюд дальше каждое открывается заново. Производного там нет. `main.tsx` ждёт `lastCalculatorReady`.
- **Подсказки для новых** (этап 18) — там же, `hints` (`HintPrefs` из `src/onboarding/hints.ts`): `settled` (первый запуск с подсказками разобран), `off` («Пропустить» / «Не показывать»), `welcome` (приветствие пройдено), `tour` (`'done'` или шаг, с которого продолжить). `PREFS_VERSION = 5`: миграция v2 → v3 добавляет пустые `hints` (тест на фикстуре v2), v3 → v4 — `dishesByCategory: false`, v4 → v5 — `composition: false` (тесты на фикстурах v3 и v4). Последний калькулятор — `LAST_CALCULATOR_VERSION = 3`: миграция v1 → v2 убирает `folded` (ингредиенты больше не сворачиваются), v2 → v3 — `unit`, `barUnit`, `shown` и свои порции в процентах (процентов в интерфейсе больше нет; своя порция — граммы). Если при первом запуске с подсказками на устройстве уже есть блюда, `settleHints` (в `main.tsx`, после загрузки данных) отмечает приветствие и тур пройденными: подсказки — для новых.
- **«По категориям»** (меню блюд) — там же, `dishesByCategory: boolean` (по умолчанию `false`), сеттер `setDishesByCategory`. Настройка устройства: не синхронизируется и не входит в копию данных. Миграция v3 → v4 ставит `false` (тест в `prefsMigrations.test.ts`).
- **Копия в файле** (Настройки → «Копия данных»): «Скачать» — JSON `{ app, version, exportedAt, state }` (`src/store/backupFile.ts`); «Загрузить» — файл любой прошлой версии проходит те же миграции (`readBackupFile`), после подтверждения заменяет данные (`replaceData`), тост «Отменить» возвращает прежние. Чужой, битый или более новый файл — тост «Файл не подошёл».

### 5.3. Версия схемы и миграции

- `src/store/migrations.ts`: `CURRENT_VERSION = 13` и массив чистых функций `migrations[n]: (stateVn) => stateVn+1`.
  - v1 → v2: пустые порции (`grams: null`) получают `basis: 'default'` — в v1 они и задумывались как «следуют за блюдом».
  - v2 → v3: у готовки появляется `kind`. Не больше одного ингредиента и он не «не учитывать» → `simple`, иначе `composite`.
  - v5 → v6: у блюд убран `companyId` — блюдо не привязано к людям.
  - v6 → v7: у готовок `keepPercent: null` — ничего не отложено «на завтра».
  - v7 → v8: `holdMs: 1500` — сколько держать «×», чтобы убрать человека (настройка).
  - v8 → v9: общий состав `lineup` заменён составами блюд `lineups`. Сохранённый общий состав становится составом каждого блюда (компания не выбрана — в списке подсвечивается совпадающая); не было состава — `{}`.
  - v4 → v5: `lineup: null` — общий состав калькулятора ещё не выбран.
  - v3 → v4: блюда и компании. Старые готовки удаляются (согласовано: прототип, чистый лист), тара сохраняется, состав по умолчанию становится компанией «Обычно» с равными долями.
  - v9 → v10 (этап 13): у тары и компаний `createdAt` — их порядок на всех устройствах группы. Существующим проставляются возрастающие метки от `1970-01-01T00:00:00.000Z` с шагом 1 мс в текущем порядке; уже заданный `createdAt` не трогается.
  - v10 → v11 (этап 15): готовки удаляются (истории больше нет; снимок v10 остаётся в `…:backup:v10:…`), у блюд `cooked: null`.
  - v12 → v13: у блюд `category: null` («по названию»). Записи `dish` с `v: 12` из группы мигрируют так же (`migrateChange`); сервер (`worker/`, D1) хранит запись как JSON-текст и версию `v`, схема таблиц не меняется, миграции D1 не нужно. Устройство со старой версией, получив запись v13, ставит синхронизацию на паузу — «Обновите приложение» (§10).
  - v11 → v12 (#42): у блюд `usedOn = [день из updatedAt]` (по местному времени) — сразу после обновления «Частые» совпадают с прежним порядком по последнему использованию. Записи `dish` с `v: 11`, пришедшие из группы, мигрируют так же (`migrateChange`); устройство со старой версией, получив запись v12, ставит синхронизацию на паузу — «Обновите приложение» (§10).
- **С синхронизацией** (этап 13) изменение формы данных касается и сервера: каждая запись на сервере несёт свою версию `v`. Записи старших версий клиент мигрирует теми же шагами. Запись новее `CURRENT_VERSION` ставит синхронизацию группы на паузу — «Обновите приложение» (§10).
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
    RootLayout.tsx      — оболочка: баннер ошибки чтения, <ScreenTransition> вокруг <Outlet />, <Toaster />, <UpdatePrompt />, TooltipProvider, <ScrollRestoration /> (прокрутка при «назад»); нижнего меню нет (этап 15); невидимое поле `KEYBOARD_PROXY_ID` вне <ScreenTransition> (не пересоздаётся при переходе) — iPhone открывает клавиатуру меню блюд по тапу 🔍 (UX §3)
    useBack.ts          — «←» и «Отмена» (docs/UX.md «Назад»): шаг назад по истории (`navigate(-1)`); без предыдущего экрана в приложении (`location.key === 'default'`) — запасной адрес с `replace`
    ScreenTransition.tsx — анимация входа экрана (docs/UX.md «Переходы между экранами»): внутренняя обёртка с `key` = экран (`screenKey`: все `/d/:id` — один экран, смена блюда анимируется внутри `CalculatorScreen`; все `/settings/*` — один экран, смена подраздела анимируется внутри `SettingsScreen`), направление по `useNavigationType()` — PUSH вглубь, POP назад (в т. ч. `navigate(-1)` из useBack и системный «назад»), REPLACE, первый экран и переход, который браузер анимировал сам (`popstate` с `hasUAVisualTransition`, свайп в iOS Safari), — без анимации; классы `tw-animate-css` под `motion-safe:`, `overflow-x-clip` на внешней обёртке против горизонтальной прокрутки. Работает для всех маршрутов `router.tsx`, новые экраны получают её сами. Экран поверх другого (UX §3а) — тот же ключ, что у экрана под ним (`screenKey` отрезает `tare/new`, `company/new`, `copy`, `from-dish`): нижний не пересоздаётся. Анимацию текущего перехода ScreenTransition отдаёт через `NavigationAnimationContext`
    screenAnimation.ts  — `NavigationAnimationContext`, классы входа `screenEnterClass`, `useReturnAnimation(covered)` — классы для спрятанной части экрана под экраном поверх: при «назад» она въезжает заново (анимация повторяется, когда элемент выходит из `display: none`)
    OverScreen.tsx      — обёртка экрана поверх другого: въезжает сам, с анимацией перехода, который его открыл
    enterAnimation.ts   — чистая логика переходов (тест в `app/__tests__`): какая анимация у входящего экрана; ключ записи истории из `popstate`, которую браузер уже анимировал; `screenKey` — какой экран показывает путь (все `/settings/*` — один экран); `settingsSwitchAnimation` — как сменить подраздел настроек внутри экрана (PUSH/POP — весь экран вглубь/назад, REPLACE из меню — только содержимое, сторона по порядку в меню); `dishSwitchAnimation` — сторона въезда калькулятора при смене блюда (по местам чипов на полке, иначе по типу навигации); `shelfScrollTarget` — куда прокрутить полку, чтобы текущий чип был виден
    LocalDataDialog.tsx — «Перенести данные этого устройства?» при первом входе (этап 13)
    UpdatePrompt.tsx    — новая версия приложения: тост «Есть новая версия · Обновить» (useRegisterSW); проверка обновления при каждом возврате на экран
    router.tsx          — createHashRouter: корневой layout (шапка, <Outlet />) + маршруты экранов; экраны поверх другого (UX §3а) — его дочерние маршруты
    paths.ts            — адреса экранов
  screens/
    DishList/           — HomeScreen (#/ → последнее блюдо или пустое меню), DishMenuScreen (меню блюд: шапка с «+» и «⋯»), DishMenu (поле, разделы, строка «Создать», пустое приложение; состояние в адресе — только `q`), OpenGroupLink; `src/components/DishSearch/` (DishSearch, DishSearchGroup, DishSearchRow, Highlight) — общий поиск (в поле у меню блюд — кнопка «По категориям»), раздел (с числом блюд справа) и строка (с иконкой категории в начале) для меню и «Из блюда»; `src/components/DishCategoryIcon.tsx` — единственная карта «категория → иконка» (lucide: Soup, Drumstick, Wheat, Salad, EggFried, CakeSlice, CupSoda, Utensils) — в строках списка и на чипах полки
    DishEditor/         — создание и правка блюда, вариант «Одной строкой» (этап 19): DishEditorScreen пересоздаёт DishEditorForm при смене блюда (не при переходе на `from-dish`, `tare/new`); черновик — название, фраза, свои «не учитывать», тара — в состоянии формы, «Создать» / «Сохранить»
      PhraseField.tsx — «Что в блюде»: Textarea, «Вставить», «Из блюда», микрофон, подсказка / «Слушаю…» / «Сказали»
      PhraseList.tsx, PhraseRow.tsx — разбор: строка на продукт (тап — учитывать или нет, × — убрать), пометки
      TareChips.tsx — «В чём взвешиваешь»: «+» (экран «Новая тара» поверх формы), «Без тары», тары
      DeleteDishDialog.tsx — подтверждение «Удалить блюдо» из «⋯»
      FromSimpleDishScreen.tsx — экран «Из блюда» (`…/from-dish`): тот же список в режиме выбора (`dishPicks`), поиск во весь экран; выбранное блюдо уходит в форму через `editorOutlet.ts`
    Calculator/         — главный экран (этап 15)
      DishShelf.tsx           — полка: 🔍 (меню блюд; ⌘K, «/»), чипы по последнему использованию (пересортировка при открытии и возврате в приложение), «⋯»; прокручивает к текущему чипу, только если он не виден; сообщает `CalculatorScreen` места чипов при тапе
      DisplayRow.tsx, RawTile.tsx, TareSelect.tsx — плитки «Сухой | Готовый», «Сырой» составного с кнопкой «›», тара под плитками
      DigitsInput.tsx         — число калькулятора как поле: shadcn Input шириной по тексту, выделение при фокусе
      CompanyPicker.tsx, PersonResult.tsx, PortionRecipe.tsx, messages.ts — «Кто ест» с пунктом «Доли»; строка человека или порции
      PortionStepper.tsx      — «− 7 +» справа от поля «Доли»: число порций между кнопками (`ButtonGroup`, этапы 16–17)
      PortionSummary.tsx, PortionTile.tsx — «Доли» (этап 17): ответ одной строкой «по 80 г × 7 · 29 г сухого» с ⧉ (`splitSummary`) и контейнер порции в сетке по три: номер в крышке, число-поле своей порции (`DigitsInput`), сухой вес, ⧉ — когда порции разные или своя
      IngredientsScreen.tsx   — экран «Ингредиенты» (`#/d/:id/ingredients`): веса ингредиентов составного блюда полями `NumberField`
      NewTareScreen.tsx       — экран «Новая тара» (`#/d/:id/tare/new`, и над редактором блюда: `#/d/:id/edit/tare/new`, `#/d/new/tare/new`): TareForm, список «Добавлено» с выбранной, «Готово» в BottomBar; тара уходит в экран под ним через `TareOutlet`
      NewCompanyScreen.tsx    — экран «Новая компания» (`#/d/:id/company/new`): CompanyForm, «Добавить компанию» в BottomBar
      calculatorOutlet.ts     — что калькулятор передаёт экранам над собой (`useOutletContext`): выбрать тару, выбрать компанию
    Copy/
      CopyTextScreen.tsx      — экран «Скопируйте вручную» (`…/copy` под калькулятором и подразделом настроек): текст приходит в состоянии навигации, выделен
    Popular/            — экран «Популярные блюда» `#/popular` (этап 20, UX §3г): PopularScreen (отметки, вес и «Добавить» живут в его состоянии, ничего не сохраняется до «Добавить»; один `addDishes`, калькулятор первого отмеченного с `replace`), PopularFilters (поле поиска и чипы), PopularSection (раздел с «Отметить все»), PopularRow (строка: `NumberField` 88 × 44, отметка 32 px, «уже есть»). Признак «после группы» — `?group=1` (`popularPath({ group: true })`); после приветствия экран открывают с `state` «нет предыдущего экрана» (`NO_PREVIOUS`), чтобы «Пропустить» вёл на `#/`
    Welcome/            — приветственный экран `#/welcome` (этап 18, UX §3в): WelcomeScreen — шаги внутри экрана, последний — аккаунт; иллюстрации из логотипа WelcomeBoxes, WelcomeTiles, WelcomeShares, WelcomeDevices (inline SVG, CSS-анимации под `motion-safe:`)
    Join/               — вступить в группу: JoinScreen по ссылке `#/join/:code` (этап 14), JoinByCodeScreen — код вручную `#/join`
    Account/            — вход (этап 12): AccountScreen (Tabs «Войти / Создать аккаунт»), SignInForm, SignUpForm, ResetPasswordScreen
    Settings/           — настройки по подразделам (docs/UX.md «Настройки»); AccountSection + PasskeySetting (список passkey, добавить, удалить) + SyncStatusLine — «Аккаунт»; GroupSection + GroupPicker, GroupName, GroupMembers, InviteCard, LeaveGroupButton — «Группа» («Вступить по коду» — ссылка на `#/join`)
      SettingsScreen.tsx      — раскладка: меню подразделов + выбранный подраздел; на телефоне — либо список (ссылки добавляют запись в историю), либо подраздел; с `md` меню (ссылки заменяют адрес); анимация смены подраздела
      SettingsMenu.tsx        — меню подразделов (Item-ссылки)
      SettingsSectionContent.tsx — какие *Section показать в подразделе
      sections.ts             — список подразделов: адрес, название, подпись, иконка
      TaresSection (новая — TareForm), CompaniesSection (CompanyCard: правка на месте через CompanyForm), PresetsSection, DataSection
  components/
    ui/                 — компоненты shadcn (генерирует CLI, руками правим только при необходимости)
    NumberField.tsx     — поле граммов: shadcn Field + InputGroup + parseGrams (см. ниже); для плотных строк (этап 20): `groupClassName`, `inputClassName`, `hideError`, `keepInvalid`, `selectOnFocus`, `onInvalidChange`, `onFocus`
    ScreenHeader.tsx    — шапка экрана: «← назад» (шаг назад по истории через useBack; запасной адрес и подпись — пропсы), заголовок, действия экрана (каждый экран рендерит свою)
    MoreMenu.tsx        — «⋯»: действия экрана и «Настройки», точка «нужно внимание»; во всех шапках
    ShareControls.tsx   — строка под полосой долей: «− Ваня +» (когда кто-то выбран), «Поровну» (точно поровну, `equalSplit`); процентов нет
    CopyButton.tsx      — shadcn Button + Clipboard + тост; без доступа к буферу — экран `copy` под текущим (калькулятор, подраздел настроек)
    HoldButton.tsx      — × удержанием: рамка закрашивается, отпустил раньше — ничего
    HoldToConfirmButton.tsx — подтверждение необратимого (сброс, удаление аккаунта): держать 5 с, заливка и отсчёт
    SwipeRow.tsx        — строка со свайпом на сенсорном экране (`pointer: coarse`): влево — красное «Убрать», вправо — «Копировать»; полный свайп делает действие сразу. Поверх `useDrag` и shadcn `Button`; пороги — именованные константы; положение и прозрачность пишутся в `style` через ref, без перерисовки React на каждый кадр; удаление — уезжание влево и схлопывание высоты (Web Animations API), `ref.remove()` — то же для кнопки × строки; `itemId` — строка, возвращённая «Отменить», раскрывается. Куда доехать после отпускания, сопротивление за краем и длительность — чистые функции `domain/swipe.ts`
    ShareSlider.tsx     — полоса долей (48 px, имя над граммами): сегменты, ручки границ (только где помещаются — контейнерный запрос `@container/bar`; у краёв выбранного — всегда), ShareControls; «На завтра», `numbered` (номера порций) и `empty` (пустая полоса «Добавьте людей», пока никого нет, — `<label>` поля «+ Имя»: тап ставит в него курсор) — необязательные пропсы (калькулятор, «Доли», компании в настройках)
    AddPersonRow.tsx    — поле «+ Имя» во всю ширину (`InputGroup`, «+» внутри слева, как лупа у поиска): Enter — человек добавлен, поле готово для следующего
    CompanyForm.tsx     — компания: название, полоса долей ShareSlider без «На завтра», люди с × удержанием, «+ Имя»; одна форма для настроек и экрана «Новая компания»
    TareForm.tsx        — новая тара: крупные «Название» и «Вес» (NumberField size="lg"), «Добавить тару» обычного размера справа; после добавления пустая, фокус в «Название»; одна форма для настроек и экрана «Новая тара»
  lib/
    utils.ts            — cn() от shadcn
    useSpeechRecognition.ts — свой хук Web Speech API (§2): supported, listening, живой текст, start / stop, ошибки
  store/
    store.ts, migrations.ts, id.ts, hooks.ts
    __tests__/migrations.test.ts
    account.ts          — кэш аккаунта: кто вошёл, группы, группа по умолчанию (этап 12)
    prefs.ts            — настройки устройства: люди или «Доли», порции блюд (этап 16), подсказки для новых (этап 18, §5.2)
    prefsMigrations.ts  — версия и миграции настроек устройства
    lastCalculator.ts   — последний калькулятор: блюдо и ввод, чтобы вернуться к ним после перезапуска (§5.2)
    sync.ts             — статус синхронизации и данные устройства, ждущие «Перенести?» (этап 13)
  account/              — клиент Better Auth (authClient.ts), тексты ошибок входа (authErrors.ts), refreshAccount.ts, тип Me — общий с воркером (types.ts) (этап 12); groupsApi.ts, inviteCode.ts, groupLabel.ts, networkText.ts (этап 14)
  onboarding/           — подсказки для новых (этап 18): hints.ts — чистые функции (показать ли приветствие и с какого шага тур, шаги тура и их тексты, «Пропустить», «Показать заново»; тест в `onboarding/__tests__`), useCalculatorTour.ts — тур driver.js по меткам `data-hint` на калькуляторе
  sync/                 — синхронизация, см. §10 (этап 13): protocol, records, diff, merge, migrateChange, outbox, engine (чистые) + runner, transport, session (браузер)
  domain/               — см. §4
worker/                 — сервер, см. §9 (этап 12): index.ts (Hono), auth.ts, me.ts, account.ts, sync.ts, syncRequest.ts, invites.ts, migrations/, __tests__/
scripts/appVersion.ts  — версия сборки для `__APP_VERSION__` (§7); тест в `scripts/__tests__`
scripts/auth-schema.mjs — SQL недостающих таблиц Better Auth против локальной D1 (`pnpm -s db:auth-schema`)
wrangler.preview-db.jsonc — только база превью, для `pnpm db:migrate:preview` (CLOUDFLARE §5)
```

### Какие компоненты shadcn для чего

| Место в UI | shadcn |
|---|---|
| Кнопки, «+ Ингредиент», «Остаток», «Копировать» | `Button` |
| Поля граммов, названий, имён | `Input`, `Label` |
| «Не учитывать» | `Checkbox` или `Switch` |
| «Без тары / С тарой» | `ToggleGroup` (или `Tabs`) |
| База порции «сырой / готовый / сырой: курица» | `Select` |
| Категория блюда (редактор) | `Select` без поиска под «Название»: «По названию · <угадано>» (→ `category: null`), `SelectSeparator`, восемь категорий |
| Меню блюд | Экран: `Command` без своего фильтра (`shouldFilter={false}`, список готовит `dishMenu` в домене; cmdk даёт ↑ / ↓ / Enter), поле — `InputGroup` с ✕ и кнопкой «По категориям» (`InputGroupButton`, `ListTreeIcon`, `aria-pressed`, `Tooltip`), строка — `CommandItem` (общая с «Из блюда»); фильтра и сортировки нет; «+» в шапке — `Button` `secondary` `icon` |
| «⋯» в шапках | `DropdownMenu` |
| Подсказка «Найти блюдо ⌘K /» | `Tooltip` + `Kbd` |
| «k блюда» под показаниями (`KHint`) | Подпись с пунктирным подчёркиванием: `Tooltip` с `hover` + точная мышь, иначе тап открывает `Sheet` `side="bottom"` с тем же текстом |
| «Что в блюде» в редакторе | `Textarea` (16 px, растёт по тексту — `field-sizing: content`); «Вставить», «Из блюда» — `Button` variant `ghost` над полем |
| Микрофон в поле «Что в блюде» | `Button` size `icon`, круглый, в правом нижнем углу поля; при записи — variant `default` с пульсом (`motion-safe:animate-pulse`), распознавание — `lib/useSpeechRecognition` |
| Разбор фразы | Список кнопок-строк на `bg-muted/60` (тап — учитывать или нет, фокус остаётся в поле), × — `Button` variant `ghost` size `icon`; строка с курсором — `bg-card`; пометки — `text-destructive` / `text-warning` |
| Тара в редакторе: «+», «Без тары», тары | Ряд чипов с прокруткой вбок, как полка блюд (`buttonVariants` secondary, выбранный — `bg-card` с `ring-foreground`); «+» — ссылка на экран «Новая тара» поверх формы |
| «⋯» в редакторе: «Составное на основе», «Удалить блюдо» | `MoreMenu` (пункт-ссылка или пункт-действие) + `AlertDialog` |
| «Из блюда» в редакторе | `Command` на экране во весь экран (`…/from-dish`), на всех ширинах (UX §3а) |
| Тара в калькуляторе + «+ Добавить тару» | `Select` (последний пункт закрывает список и открывает экран «Новая тара», значение не меняет) |
| Новая тара: форма (настройки, экран «Новая тара») | `Field` + `Input` (`h-14 text-lg`) + `NumberField size="lg"`, кнопка `Button` обычного размера справа под полями |
| «Добавлено» и «Готово» на экране «Новая тара» | «Добавлено» — `Item` (кнопки-строки с галочкой у выбранной); «Готово» — главная кнопка `Button` в `BottomBar` |
| Экраны «Новая тара», «Новая компания», «Вступить по коду», «Из блюда», «Скопируйте вручную» | Свой адрес в `router.tsx`: `ScreenHeader` + форма + `BottomBar` (UX §3а). Экран поверх другого — его дочерний маршрут: тот рендерит `useOutlet()` и прячет себя (`hidden`), но остаётся смонтированным — после «назад» всё как было (введённые числа, черновик); результат (тара, компания, ингредиент) отдаётся через контекст `Outlet`, а не через стор или состояние навигации: шаг назад (`navigate(-1)`) состояние не несёт |
| Компания в калькуляторе + «Добавить компанию» | `Select` (последний пункт закрывает список и открывает экран «Новая компания», значение не меняет) |
| «Доли» в списке «Кто ест» | Пункт того же `Select` (после компаний); «Свой состав · N» — пункт возврата к людям, пока выбраны «Доли» |
| «− 7 +» порций рядом с полем «Доли» | `ButtonGroup`: `Button` variant `outline` size `icon` + `ButtonGroupText` с числом |
| Секции экрана | Без карточек: `<section>` с заголовком `h2` и отступами, `Separator` между группами. Главная кнопка — `components/BottomBar` (на телефоне прилипает к низу, с `lg` — обычная строка) |
| Сетка порций в «Доли» | `<ul>` grid по три (`max-[360px]:grid-cols-2`, `lg:grid-cols-4`); контейнер — как плитка калькулятора (`bg-muted/60`, активный — `bg-card` с рамкой), своя — `outline-dashed`; ⧉ — `CopyButton` |
| Строки меню блюд | `CommandItem`: название слева, вес или состав справа |
| Подпись + поле + ошибка | `Field`, `FieldLabel`, `FieldError` |
| Суффикс «г» в поле | `InputGroup` + `InputGroupAddon` |
| Пустой список | `Empty` |
| Плашка сверки, баннер ошибки чтения, подсказки | `Alert` (варианты default / destructive / `warning` — добавлен в `alert.tsx` через `cva`) |
| «Скопировано», «Удалено · Отменить» | `Sonner` (toast с action) |
| Удалить / скопировать строку на телефоне и iPad | `components/SwipeRow` (`@use-gesture/react`) + `Button` под строкой; кнопки строки скрыты вариантом Tailwind `pointer-coarse:sr-only` — остаются для клавиатуры и экранного диктора |
| Тур по калькулятору (этап 18) | `driver.js` (исключение, как `sonner`): карточка `.hint-popover` оформлена токенами темы, затемнение — `--scrim`; цели — `data-hint` на элементах |
| Популярные блюда (этап 20, UX §3г) | Экран по §3а, но без `BottomBar`: действие — `Button` ghost справа в `ScreenHeader` («Пропустить» / «Добавить»); поле поиска — `InputGroup`; чипы — как на полке (`buttonVariants` secondary, выбранный `bg-card` с `ring-foreground`), `DishCategoryIcon`; строка — `NumberField` (`groupClassName` / `inputClassName` / `hideError` / `keepInvalid` / `selectOnFocus` / `onInvalidChange`) и круглая отметка |
| Приветственный экран (этап 18) | Экран по §3а: шапка с точками шагов и «Пропустить» (`Button` ghost), иллюстрация (inline SVG), заголовок и текст, `BottomBar` с главной кнопкой |
| Хаб настроек (телефон) | `SettingsHub`: карточка аккаунта и блоки-«коробки» строк (`Link`), тема и подсказки на месте |
| «Тема» | `ToggleGroup` из трёх плиток-миниатюр (`ThemePreview`, токены темы через классы `.light` / `.dark`) |
| «Подсказки» | `Switch`, вся строка — его `label` |
| Подтверждения (удаление блюда, «Перенести данные?», выход из группы и т. п.) | `AlertDialog` — единственное окно поверх экрана с текстом (UX §3а) |
| Запасной показ текста для копирования | Экран во весь экран с `Textarea` (UX §3а) |
| Шапка, переход в настройки | `Button` variant `ghost` + иконки `lucide-react` |
| Меню подразделов настроек (список на телефоне, панель слева с `md`) | `Item` (`asChild` + `<Link>`): `ItemMedia` иконка, `ItemTitle`, `ItemDescription`, «›» в `ItemActions`. `Sidebar` из shadcn не берём: он для навигации всего приложения (провайдер, `Sheet` на телефоне), а у нас навигация — полка блюд и «⋯», и на телефоне подраздел — отдельный экран, а не выезжающая панель |

Экраны вместо окон поверх (UX §3а) сделаны в [#38](https://github.com/vanpav/split-the-portion/issues/38); поиск блюд — меню блюд во весь экран `#/dishes` ([#42](https://github.com/vanpav/split-the-portion/issues/42)).

Если нужного компонента нет в shadcn — сначала ищем в экосистеме shadcn/Radix, потом спрашиваем пользователя.

### NumberField
- Обёртка над shadcn `Input`: `type="text" inputMode="decimal" enterKeyHint="next"`, шрифт ≥ 16 px (`text-base`), высота ≥ 44 px (`h-11`).
- Черновик-строка живёт только пока поле в фокусе. На каждое изменение вызывается `parseGrams` из домена: если число валидно — `number` уходит в стор, если нет — под полем ошибка (`FieldError`), текст **не стирается**, в стор ничего не пишется. Пустая строка отдаётся как `null`.
- Вне фокуса поле показывает значение из стора через `formatInput` (домен: запятая, до 1 знака). Так поле само подхватывает внешние изменения (кнопка «Остаток»), без эффектов синхронизации. После ухода из поля с ошибочным текстом показывается последнее валидное значение.
- Суффикс «г» визуально внутри поля.
- `onEnter` — колбэк на Enter (переход к следующей строке ингредиентов).
- `size="lg"` — крупное поле для форм добавления (новая тара): высота 56 px (`h-14`), шрифт 18 px (`text-lg`).
- Необязательный `validate(value) → сообщение | null`: дополнительное правило (например, вес тары > 0). Сообщение показывается под полем, значение в стор не уходит.
- Если после сохранения поле нужно очистить, пока оно в фокусе (форма добавления), его пересоздают через `key`: в фокусе поле показывает свой черновик, а не значение из стора.
- Разбор числа — доменная логика (SPEC §7), поэтому он свой и с тестами. Обёртка над `Input` — композиция, а не велосипед.

### Стили и адаптивность
- Tailwind-классы прямо в JSX, `cn()` для условных классов. Отдельных CSS-файлов на компонент нет.
- Цвета — только через переменные темы shadcn (`bg-background`, `text-destructive` …). Для статуса «предупреждение» добавляем переменную `--warning` в `index.css`.
- Тема — стиль «Ланчбокс» ([DESIGN.md](../DESIGN.md)): токены shadcn в `:root` и `.dark` в `index.css`. Светлая или тёмная — по настройке системы или как выбрано в «Настройки → Оформление»: `ThemeProvider` из `next-themes` ставит `.dark` на `<html>` (`main.tsx`), выбор хранит сам `next-themes` в `localStorage` (ключ `theme`). Это настройка устройства, а не данные: в стор и копию данных не попадает.
- `--chart-1..10` — цвета крышек едоков (десять; с одиннадцатого — по кругу), по месту человека в сегодняшнем составе (`components/lids.ts`); текст на них — `--chart-foreground`. Курсор полей калькулятора (`DigitsInput`) — системный; его `caret-color` идёт по крышкам едоков (`animate-caret-N` в `index.css`).
- Одна колонка до `lg` (1024 px): секции идут друг под другом «Ингредиенты → После готовки → Порции».
- От `lg` — две колонки (`lg:grid-cols-2`): слева ввод («Ингредиенты», «После готовки»), справа «Порции» и итоги (`lg:sticky`). Ширина контента ≤ 1200 px.
- Цвета состояний: ok — нейтральный, предупреждение — жёлтый, ошибка/перебор — `destructive`. Состояние дублируется текстом, а не только цветом.
- Минимальная высота интерактивных элементов — 44 px: в `components/ui` подняты размеры по умолчанию у `button`, `input`, `input-group`, `toggle`, поля поиска и пунктов `command`. При `shadcn add` CLI спрашивает про перезапись изменённых файлов — отвечать «нет».

### Маршруты
| Hash | Экран |
|---|---|
| `#/` | `HomeScreen`: калькулятор последнего блюда (`recentDishes`); без блюд — меню блюд с пустым состоянием |
| `#/dishes[?q=…]` | Меню блюд: поиск (параметров по умолчанию нет); при наборе адрес заменяется (`replace`) |
| `#/d/new[?from=…]` | Добавить блюдо (одна форма, вид выбирается и следует из состава); `from` — простое блюдо, на основе которого составное |
| `#/d/new/from-dish[?from=…]` | «Из блюда» поверх формы «Добавить блюдо» |
| `#/d/:id` | Калькулятор блюда: `DishShelf` вне ключа (при смене блюда остаётся на месте, экран не меняется), Calculator пересоздаётся при смене блюда и въезжает со стороны чипа |
| `#/d/:id/ingredients` | «Ингредиенты» поверх калькулятора (составное блюдо); то же |
| `#/d/:id/tare/new` | «Новая тара» поверх калькулятора; «назад» без предыдущего экрана — калькулятор |
| `#/d/:id/company/new` | «Новая компания» поверх калькулятора; то же |
| `#/d/:id/copy` | «Скопируйте вручную» поверх калькулятора (текст — в состоянии навигации; без него — назад) |
| `#/d/:id/edit` | Правка блюда, «Составное на основе», удаление |
| `#/d/:id/edit/from-dish` | «Из блюда» поверх формы «Изменить блюдо» |
| `#/settings` | Настройки: на телефоне — список подразделов, с `md` — меню слева и «Тара» справа |
| `#/settings/:section` | Подраздел настроек: `companies`, `tares`, `appearance`, `data`; с этапа 12 — `account`, с 14 — `group` (неизвестный → `#/settings`) |
| `#/settings/:section/copy` | «Скопируйте вручную» поверх подраздела (ссылка-приглашение) |
| `#/settings/group/:groupId` | Экран группы поверх «Группы» (§3а): открыть, название, участники, приглашение, выход |
| `#/settings/account/photo` | «Фото»: кадрирование аватара поверх «Аккаунта»; снимок — object URL в `location.state` |
| `#/account[?tab=sign-up&next=…]` | Вход и регистрация (этап 12); `tab=sign-up` — открыта вкладка «Создать аккаунт» (с приветствия); после входа — `next` или Настройки → «Аккаунт» |
| `#/popular[?group=1]` | Популярные блюда (этап 20): после приветствия (пока блюд нет), после «Создать группу» (`?group=1`), из «⋯» меню блюд и «Выбрать из популярных» в пустом списке |
| `#/welcome` | Приветственный экран (этап 18): `#/` ведёт сюда, пока на устройстве нет блюд и приветствие не пройдено; пройдено — уводит на `#/` |
| `#/account/reset` | Новый пароль по ссылке сброса (`token` — в строке запроса до `#`) |
| `#/join` | «Вступить по коду»: код вручную; «Дальше» заменяет экран на `#/join/:code`; «назад» без предыдущего экрана — Настройки → «Группа» |
| `#/join/:code` | Вступить в группу по коду из ссылки (этап 14) |

Hash-маршруты выбраны потому, что работают на любом статическом хостинге без настройки сервера. Неизвестный путь → `errorElement` / `*` с редиректом на список. Навигация — `<Link>` и `useNavigate()`, параметр — `useParams()`.

## 7. Сборка и проверка

- `pnpm test` → `vitest run`; `pnpm test:watch` → `vitest`.
- Конфиг Vitest — в `vite.config.ts` (`test: { environment: 'node' }`). Домену DOM не нужен.
- `pnpm build` = `tsc -b && vite build`: должен проходить без ошибок типов.
- `pnpm lint` = oxlint.
- **Версия сборки** — `__APP_VERSION__` (`define` в `vite.config.ts`, тип в `src/vite-env.d.ts`), считает `scripts/appVersion.ts`: `MAJOR.MINOR` из `version` в `package.json`, `PATCH` — `git rev-list --count HEAD`. Прод — `0.1.312`, превью ветки — `0.1.312-b241417` (короткий sha коммита), локально — `0.1.312-b241417-dev`. Видна в настройках под блоком «Приложение» (UX §4 «Настройки»). Подробности — CLOUDFLARE §8.
- Для проверки на телефоне: `pnpm dev --host`, открыть адрес из локальной сети. Помнить: у `localhost` и у LAN-адреса разные origin, поэтому и разные хранилища; перенести данные — «Копия данных» в настройках.
- После `shadcn add` проверить, что сгенерированный код проходит `pnpm lint` и `pnpm build`.
- **С этапа 11** проверка PWA — `pnpm build`, затем конфигурация `preview` в `.claude/launch.json` (`pnpm preview`, порт 4180; Service Worker в `pnpm dev` выключен) и превью-деплой на iPhone. После проверки Service Worker на `localhost:4180` лучше удалить (DevTools → Application или `navigator.serviceWorker.getRegistrations()`), чтобы он не перехватывал другой проект на том же порту.
- **PWA (`vite.config.ts`, `VitePWA`):**
  - `registerType: 'prompt'` — новая версия ждёт «Обновить»;
  - манифест «Порции», `display: standalone`, цвет — `frosted-ground`;
  - precache всей сборки, кроме арабского и иврита из Rubik;
  - `navigateFallback: index.html`, `/api/*` мимо Service Worker;
  - `public/_headers` отдаёт `sw.js` и манифест с `no-cache`.
- **Иконка** — стопка из трёх ланчбоксов на `navy-ink`, по корпусу на едока (`lid-sky`, `lid-sunflower`, `lid-mint`), крышки белые. Верхний открыт: каша, морковные палочки и брокколи, его крышка прислонена к стопке. Цвета еды есть только в иконке, в теме их нет. Рисунок — `public/favicon.svg`: плитка со скруглением, рисунок занимает её середину. На iPhone и во вкладке он крупный; maskable-иконке Android `pwa-assets.config.ts` даёт отступ, чтобы рисунок поместился в безопасный круг (80 % ширины), и заливает край тем же `navy-ink`. После правки рисунка — `pnpm icons`.
- **С этапа 12** `pnpm dev` поднимает и воркер с локальной D1 (`@cloudflare/vite-plugin`). Миграции — `pnpm db:migrate:local` / `pnpm db:migrate:preview` / `pnpm db:migrate:remote`, деплой — `pnpm run deploy` ([CLOUDFLARE.md](CLOUDFLARE.md)). Вход по `http://192.168…` не работает: cookie `Secure` и WebAuthn требуют HTTPS. Вход на телефоне проверяем на превью-деплое.

## 8. Открытые вопросы (решить с пользователем)

По правилу «не пишем велосипеды» всё, что пришлось бы писать руками, выносим сюда.

Решено (2026-10-01): роутер — React Router (на момент установки — v8), id — nanoid (см. §2).

1. **Wake Lock** (бэклог P1): `react-screen-wake-lock` / `@uidotdev/usehooks` или свой хук. Решить, когда дойдём.
2. ~~**PWA**~~ — решено 2026-10-06: `vite-plugin-pwa`, этап [11](roadmap/11-pwa.md).
3. ~~**Свайп строк**~~ — решено 2026-10-06: `@use-gesture/react` (#27); `react-swipeable` и `motion` не взяли (§2).
4. ~~**Подсказки для новых**~~ — решено 2026-10-07: тур — `driver.js` (§2, этап [18](roadmap/18-onboarding-hints.md)); подсказки по месту (`Alert`) сделали и убрали.
5. ~~**Языки интерфейса**~~ — решено 2026-10-07: i18next (§2, §11, этап [21](roadmap/21-i18n.md)).
6. ~~**Название приложения на en/es**~~ — решено 2026-10-08: рабочее «Portions», по-русски «Порции» (`src/app/brand.ts`). Не продуктовое: смена — правка мест из §11 «Название», данные и passkey не затрагивает.

## 9. Сервер

Этапы [12](roadmap/12-server-auth.md)–[14](roadmap/14-groups.md). Как поднять и сколько стоит — [CLOUDFLARE.md](CLOUDFLARE.md).

```
iPhone (PWA, standalone)                       Cloudflare Worker split-the-portion
┌──────────────────────────────┐   HTTPS,     ┌──────────────────────────────────┐
│ React UI → useAppStore       │   cookie     │ /api/auth/*   Better Auth         │
│   (данные открытой группы)   │ ───────────▶ │ /api/me, /api/me/default-group    │
│ persist → IndexedDB          │              │ /api/groups/:id/sync              │
│ src/sync: outbox + cursor    │              │ /api/groups/:id/invites, /invites │
│ Service Worker (precache)    │              │ всё остальное → статика dist      │
└──────────────────────────────┘              └───────────────┬──────────────────┘
                                                              ▼  привязка DB
                                         рабочий адрес: D1 split-the-portion (SQLite)
                                       превью веток: D1 split-the-portion-preview
```

- **Две базы D1 с одной схемой:** рабочий воркер пишет в `split-the-portion` (`d1_databases`), превью веток и PR — в `split-the-portion-preview` (`previews.d1_databases`). Код один, привязка в обоих случаях `DB`. Аккаунты и данные превью отдельные, с рабочей базы не копируются; миграции базы превью — руками `pnpm db:migrate:preview` ([CLOUDFLARE §5](CLOUDFLARE.md#5-миграции-базы)).
- **Один воркер на всё:** статика (`assets`) и API на одном адресе. `assets.run_worker_first: ["/api/*"]` — код запускается только для API. Один origin — cookie сессии первого лица работают в установленной PWA на iOS, CORS не нужен.
- **Код — в `worker/`**, отдельный от `src/`, со своим `tsconfig.worker.json`:
  - `index.ts` — Hono, `csrf()`, маршруты;
  - `auth.ts` — конфиг Better Auth;
  - `sync.ts`, `invites.ts`;
  - `migrations/NNNN_*.sql`.

  Общие типы протокола — `src/sync/protocol.ts`, их импортируют обе стороны. Домен (`src/domain`) воркер не импортирует: сервер не считает и не разбирает блюда.
- **Вход — Better Auth:**
  - адрес (`baseURL`, доверенный `Origin`, `rpID`) берётся из запроса: рабочий адрес, превью веток и `localhost` работают каждый под своим. Экземпляр Better Auth создаётся один раз на адрес в изоляте (`worker/index.ts`);
  - почта + пароль; хеш — нативный `node:crypto` scrypt: Better Auth 1.7 выбирает его для workerd сам (флаг `nodejs_compat`), чистый JS не уложился бы в 10 мс CPU бесплатного плана;
  - passkey (Face ID, Chrome, Windows Hello); ключей на аккаунт сколько угодно — по одному на устройство или менеджер паролей, любой можно удалить из «Аккаунта» (`deletePasskey`). Имя ключа ставит after-хук `/passkey/verify-registration` в `worker/auth.ts` по AAGUID (`getAuthenticatorName`: «iCloud Keychain», «Google Password Manager»…); ключи без имени показываются как «Passkey». Добавить ключ можно только со свежей сессией (Better Auth `freshAge`, 24 ч), иначе — «выйди и войди снова». `rpID` — хост, при смене домена ключи добавляются заново;
  - смена пароля — `changePassword` Better Auth (нужен текущий), экран `#/settings/account/password`;
  - сброс пароля: пока писем нет, `sendResetPassword` пишет ссылку в лог воркера; экран `#/account/reset` берёт `token` из настоящей строки запроса (`/?token=…#/account/reset`);
  - сессия в cookie `HttpOnly; Secure; SameSite=Lax`, живёт 60 дней с продлением;
  - ограничение частоты хранится в D1.
- **Группы — плагин `organization`:** группа = организация, участник = `member`, роли `owner` и `member`. При регистрации создаётся своя группа с названием «Личная» (`databaseHooks.user.create.after`) — на клиенте это «без названия», группа называется по людям (`groupLabel`, `customName`, `peopleLabel` в `src/account/groupLabel.ts`). Группа по умолчанию — `user.defaultGroupId` (дополнительное поле), пока человек в ней, иначе первая по дате вступления (`defaultGroupOf` в `worker/me.ts`); клиент ставит её при каждом открытии группы (`switchGroup` в `src/sync/session.ts`). Приглашения Better Auth (по почте) не используем, у нас свои коды (`group_invite`).

**Таблицы D1** (кроме таблиц Better Auth):

| Таблица | Колонки | Зачем |
|---|---|---|
| `record` | `group_id`, `type`, `id`, `data` (JSON или `NULL`), `deleted`, `v`, `seq`, `updated_by`, `updated_at`; PK `(group_id, type, id)`, индекс `(group_id, seq)` | Текущее состояние каждой записи группы (§10). Удалённые остаются надгробием |
| `group_clock` | `group_id` PK, `seq` | Счётчик изменений группы: порядок записей и курсор pull |
| `group_invite` | `code` PK, `group_id`, `created_by`, `created_at`, `expires_at`, `revoked` | Коды приглашений (этап 14) |

**API:**

| Метод и путь | Что делает |
|---|---|
| `* /api/auth/*` | Better Auth: регистрация, вход, passkey, выход, группы (`organization/*`) |
| `GET /api/me` | Пользователь с профилем (`firstName`, `lastName`, `nickname`, `image`), его группы с участниками (`memberId`, почта, роль, профиль) и своей ролью, `defaultGroupId` |
| `PUT /api/me/profile` | Имя, фамилия, короткое имя `{ firstName, lastName, nickname }` — проверка `parseProfile` (общая с клиентом): строки, ≤ 40 / ≤ 24 символов; 400 `bad_profile` |
| `PUT /api/me/avatar` | Фото — байты квадрата 256×256 из «Фото», ≤ 256 КБ (`MAX_AVATAR_BYTES`, 413 `too_large`); тип определяется по сигнатуре (JPEG, PNG, WebP), иначе 400 `bad_image`. Хранится в D1 (`avatar`), в `user.image` — адрес с версией. Ответ `{ image }` |
| `DELETE /api/me/avatar` | Убрать фото |
| `POST /api/me/reset` | «Сбросить аккаунт» (SPEC §13.2), тело `{ confirm: 'reset' }`, иначе 400 `not_confirmed`. Одна транзакция (`worker/account.ts`): свои группы без других участников — удалить с данными; в общих — передать владение следующему по дате вступления и выйти; коды, профиль, фото — удалить; новая группа «Личная». Ответ `{ groupId }` |
| `DELETE /api/me` | «Удалить аккаунт», тело `{ confirm: 'delete' }`: то же и сам пользователь с сессиями, паролем, passkey и ссылками сброса |
| `GET /api/avatars/:userId` | Фото — владельцу и тем, кто с ним в одной группе (иначе 404); `cache-control: private, immutable` — адрес меняется с каждым новым фото |
| `POST /api/groups` | Новая группа `{ name }`, создатель — владелец; 409 `group_limit`, если он уже в трёх (`MAX_GROUPS`; так же `POST /invites/:code/accept`) |
| `PUT /api/me/default-group` | Группа, которая открывается при запуске |
| `POST /api/groups/:id/sync` | Push и pull изменений группы (§10) |
| `POST /api/groups/:id/invites` | Код приглашения (действующий переиспользуется) |
| `DELETE /api/groups/:id/invites/:code` | Отозвать код (владелец) |
| `GET /api/invites/:code` | Группа и кто пригласил — для подтверждения; **без входа** (экран по ссылке) |
| `POST /api/invites/:code/accept` | Вступить в группу |

**Безопасность:**
- каждый запрос к группе проверяет сессию (иначе 401) и членство (иначе 403);
- `csrf()` сверяет `Origin`;
- тело sync проверяется: белый список типов, длина id, размер записи ≤ 64 КБ, ≤ 500 изменений;
- ограничение частоты на вход и регистрацию (Better Auth); на коды приглашений — нет: 31⁸ ≈ 8,5·10¹¹ кодов при 100 тыс. запросов в день не подобрать;
- вступление — только по действующему коду: `auth.api.addMember` у Better Auth серверный, HTTP-маршрута у него нет; отзывает код и убирает людей только владелец, переименовывает группу тоже он (права Better Auth по умолчанию);
- секреты — только `wrangler secret`, Secrets Store (для превью) и `.dev.vars` (не в git).

Сервер доверяет данным участника группы, но не разбирает их: испортить можно только свою группу.

## 10. Синхронизация

Этап [13](roadmap/13-sync.md); правила для пользователя — SPEC §13.

**Принцип: offline first.** Приложение всегда работает с локальной копией в IndexedDB, как до появления сервера. Стор и его действия о сервере не знают. Синхронизация — отдельный слой `src/sync`: подписывается на стор, копит изменения и обменивается ими с сервером, когда есть сеть и вход.

**Запись** — единица синхронизации и конфликта:

| `type` | `id` | Что внутри |
|---|---|---|
| `dish` | id блюда | `Dish` |
| `cooking` | id готовки | Только у версий до 15: `Cooking` целиком. С v11 клиент такие записи не отправляет и пришедшие пропускает (`migrateChange` → `null`); тип остаётся в `RECORD_TYPES`, чтобы сервер принимал записи старых версий |
| `tare` | id тары | `Tare` |
| `company` | id компании | `Company` |
| `lineup` | id блюда | `Lineup` — «Кто ест» у блюда |
| `settings` | `settings` | `{ holdMs }` |

Как и в IndexedDB, на сервер уходит только ввод; производные значения (k, доли, остатки) не хранятся. Настройки устройства (`src/store/prefs.ts`: люди или «Доли», порции блюд) — не записи: синхронизация подписана только на `useAppStore`, и записи для них нет (§5.2).

**Протокол** — один запрос на push и pull:

```ts
// src/sync/protocol.ts
type Change = { type: RecordType; id: string; data: unknown | null; v: number }; // data: null — удалено
type SyncRequest = { cursor: number; v: number; changes: Change[] };            // ≤ 500 изменений
type SyncResponse = { cursor: number; changes: Change[]; more: boolean };
```

Лимиты (`SYNC_LIMITS`): до 200 изменений и 512 КБ на запрос, запись ≤ 64 КБ, страница чтения — 200 записей. На бесплатном плане D1 разрешает **50 запросов на вызов, и каждая строка `batch()` считается отдельно**, поэтому push — это пять запросов при любом числе изменений: все они уходят одним JSON-параметром и раскладываются `json_each` в одном `INSERT … ON CONFLICT DO UPDATE`. Ответ собирается из JSON-текста записей, как его хранит D1, без разбора — ради лимита CPU.

Сервер в одном `db.batch()` (транзакция D1):
1. Каждое пришедшее изменение получает `seq = ++group_clock.seq` и записывается в `record` поверх прежнего (`INSERT … ON CONFLICT DO UPDATE`).
2. Отдаёт строки `record` группы с `seq > cursor` по порядку, не больше 500, кроме строк с `seq`, выданными этому же запросу (свои изменения клиенту не нужны).
3. Возвращает новый `cursor` и `more`, если отдал не всё. Курсор устройства впереди часов группы (база восстановлена из Time Travel) — чтение с нуля.

`record` хранит только последнее состояние записи, а не журнал. Поэтому старое изменение, перезаписанное более поздним, в pull уже не попадёт.

**Конфликты: побеждает пришедшее на сервер последним** — на уровне записи, удаление тоже запись. Часы устройств не участвуют: порядок задаёт `seq`. Правки разных записей не конфликтуют. Если двое без сети правили одно блюдо (например, ввели готовый вес), остаётся то, что синхронизировалось позже. Если одна сторона удалила, а другая правила — победит пришедшая позже. Для пары это редкость; слияние по полям — в бэклоге.

**Клиент (`src/sync/`):**

| Модуль | Что делает | Чистый, с тестами |
|---|---|---|
| `protocol.ts` | Типы и лимиты, общие с воркером | — |
| `records.ts` | `toRecords(state)` — всё состояние в записи (первая выгрузка), `recordKey` | да |
| `diff.ts` | `diffState(prev, next)` — какие записи изменились: сравнение по id и по ссылке | да |
| `merge.ts` | `applyChanges(state, changes, pending)` — применить пришедшее, кроме ключей с неотправленными правками; тара и компании по `createdAt` | да |
| `migrateRecord` | Запись старой версии → текущая теми же `migrations` (одна запись оборачивается в состояние); новее текущей → пауза | да |
| `outbox.ts` | Неотправленные изменения по ключу `type:id` (свежая заменяет старую) и `cursor`, в IndexedDB `split-the-portion:sync:<groupId>` | да |
| `engine.ts` | Цикл: одновременно один прогон, поводы, статус, ошибки | да, два клиента и сервер в памяти |

- **Откуда берутся изменения:** `useAppStore.subscribe((next, prev) => …)` → `diffState(storedData(prev), storedData(next))` → outbox. Отдельного кода в действиях стора нет. Любое действие, включая `replaceData` из файла, синхронизируется само.
- **Эхо:** удалённые изменения применяются `setState` с флагом `applyingRemote`, подписчик их пропускает.
- **Неотправленное побеждает пришедшее:** если по ключу есть правка в outbox, пришедшая версия не применяется. Наша уйдёт следующим push и станет последней на сервере.
- **Outbox после ответа:** удаляются только записи, которые не менялись, пока шёл запрос (сравнение `rev`).
- **Когда синхронизируемся:**
  - запуск после `ready`;
  - событие `online`;
  - `visibilitychange` → видно;
  - через 2 с после локальной правки;
  - раз в 60 с, пока экран открыт.

  Background Sync в Safari нет, поэтому синхронизация идёт только при открытом приложении. Фоном синхронизируются все группы пользователя (этап 14), без сети доступна любая уже открывавшаяся.
- **После сбоя:** при старте движок заново применяет к данным то, что ждёт отправки (`replayPending`). Outbox записывается в IndexedDB раньше данных (подписчик срабатывает внутри `setState`, до записи `persist`), поэтому после сбоя между двумя записями правда — в нём.
- **Статус** — `src/store/sync.ts`, без сохранения: `synced` (с временем), `syncing`, `offline`, `failed` (сервер ответил ошибкой), `needsLogin` (401 — данные и аккаунт остаются, «Войти снова»), `needsUpdate` (запись новее приложения), `forbidden` (403; убрать группу с устройства — этап 14). Точка на «Настройках» — только когда нужно действие: `needsLogin`, `needsUpdate`, `forbidden`.
- **Тесты:** чистые функции и движок — `src/sync/__tests__`; сервер и два телефона против настоящих запросов на локальной D1 — `worker/__tests__/{sync,convergence}.test.ts`.

**Группы на устройстве:**
- *Открыть группу:*
  1. остановить подписчика;
  2. `setState(EMPTY_STATE)` — иначе `persist` сольёт новую группу со старой;
  3. `persist.setOptions({ name: 'split-the-portion:group:<id>' })` и `await persist.rehydrate()`;
  4. включить подписчика и синхронизировать.
- *Запуск:* вошли — открывается `defaultGroupId` из кэша аккаунта (без сети тоже), иначе — локальные данные `split-the-portion`. Если вошли на устройстве ещё до синхронизации (данных группы на нём нет), при старте выполняется первый вход.
- *Первый вход:*
  - новый аккаунт — локальные данные становятся данными своей группы: `toRecords` → outbox, блоб переписывается под ключом группы, только потом удаляется старый ключ;
  - на сервере уже есть данные — вопрос «Перенести?» (`LocalDataDialog`, UX);
  - копия локальных данных до входа — `split-the-portion:backup:<ISO>`; данные другого аккаунта (после «Войти снова» под другой почтой) в группу не сливаются.
- *Выход:* предупреждение, если outbox не пуст. Затем удаляются блобы групп, их outbox и кэш аккаунта.
- *Другие группы аккаунта* (этап 14) синхронизируются фоном, по тем же поводам и по очереди, прямо в их сохранённой копии (`syncStoredGroup`): любая уже открывавшаяся на устройстве группа без сети открывается свежей, а правки, оставленные в ней перед переключением, уходят. Группу, которую здесь ещё не открывали, заранее не скачиваем. Открытие группы (`openGroup`) ждёт её фонового прогона.
- *Группа ушла* (вышел, убрали; 403 или её нет в `/api/me`): `refreshGroups` удаляет её данные и outbox с устройства, тост «Ты больше не в группе «…»»; если она была открыта — открывается группа по умолчанию.
- *Несколько вкладок* одной группы на десктопе друг о друге не знают — в бэклоге.

## 11. Языки интерфейса

Этап [21](roadmap/21-i18n.md). Языки: английский (по умолчанию), русский, испанский — `LANGUAGES` в `src/domain/language.ts`.

- **Тексты** — `src/i18n/locales/<язык>/<область>.json` (`common`, `calculator`, `dishes`, `editor`, `settings`, `account`, `join`, `onboarding`, `welcome`), один неймспейс `translation`, ключи вида `calculator.k.dish`. Русский — источник: из него выводятся типы ключей (`src/i18n/i18next.d.ts`), опечатка в ключе ломает `tsc`. Все языки в бандле: офлайн и в обёртке для сторов работают без загрузки.
- **Плюралы** — суффиксы i18next (`_one`, `_few`, `_many`, `_other`) с `count`, правила — `Intl.PluralRules`. Самописных склонений нет.
- **`t()`** — из `@/i18n`, одна функция для компонентов, тостов и подсказок вне React. Смена языка перемонтирует приложение (`app/I18nRoot.tsx`, `key` по языку вокруг `RouterProvider`; роутер живёт вне React и остаётся на том же адресе), поэтому текст, прочитанный при рендере, не устаревает.
- **Тесты** идут на русском (`src/test/setup.ts`) — на любом языке машины. `src/i18n/__tests__/locales.test.ts`: у всех языков те же ключи (без суффиксов плюралов) и те же `{{плейсхолдеры}}`.
- **Термины по языкам.** «Компания» (кто ест) — en *party*, es *mesa*; «Группа» (общий учёт) — *group* / *grupo*; «Тара» — *container* / *recipiente*. Не путать, как и по-русски.
- **Domain без языка.** Форматтеры принимают локаль; тексты собирает UI. Чего нет — домен отдаёт пустую строку (`dishTitle`, `ingredientDisplayName`), подпись «Без названия» ставит UI. Обёртки с текущей локалью — `src/i18n/format.ts` (`formatGrams`, `gramsText`, `dishTitle`, `dishRow`, `categoryLabel`, `copyText`…); компоненты берут форматтеры оттуда, не из `@/domain`.
- **Набранные граммы калькулятора** хранятся с запятой (`keypadText`, `typedGrams`), на экране — разделитель локали (`formatTyped`, `typedText`). Ввод принимает и запятую, и точку.
- **Категории блюд** — данные домена (`CATEGORY_LABELS[язык]`): поиск находит категорию по названию на любом языке («гарн», «sides», «guarn»).
- **Определение языка**: сохранённый выбор (`localStorage`, ключ `language`) → `navigator.languages` (`es-MX` → `es`) → английский. Выбор — настройка устройства, как тема: не в сторе и не в копии данных, читается синхронно до первого рендера. Настройки → Оформление → «Язык» (`LanguageSetting.tsx`, `setLanguage` из `@/i18n`; «Как в системе» убирает ключ и снова спрашивает детектор).
- **Не переводится**: что хранится в данных — имя личной группы на сервере (`PERSONAL_GROUP_NAME`, UI её имя не показывает), имена из старых миграций; пресеты популярных блюд и фразовый ввод — пока только русские (бэклог); в en/es микрофон фразы скрыт.
- **Название** — рабочее: «Portions» (en, es), «Порции» (ru). Живёт в `src/app/brand.ts` (манифест, `worker/auth.ts`), `common.appName` и текстах приглашения каждого языка (по-русски склоняется: «в «Порциях»»), `index.html` (`<title>`, `apple-mobile-web-app-title`; `<title>` и `lang` потом ставит приложение на языке интерфейса), манифесте PWA (`vite.config.ts`: `name`, `short_name`) и `worker/auth.ts` (`appName`, `rpName` — только подпись passkey; привязка идёт по `rpID` = домен, поэтому смена имени passkey не ломает). Установленная PWA на iOS сохраняет имя, с которым её поставили; Android подтягивает новое из манифеста. В сторах имя меняется с обновлением, а id пакета (bundle id) — нет: его делать нейтральным, без названия.
- **Обёртка для сторов** (бэклог): iOS — `CFBundleLocalizations` (en, ru, es) в Info.plist, иначе WKWebView отдаёт `navigator.language = en`; Android 13+ — `locales_config.xml`; название и описание в сторах — нативные ресурсы, не i18next.
