# 02 — Стор, хранение, оболочка

## Цель
Данные живут в Zustand-сторе и переживают перезагрузку. Есть каркас приложения: шапка, hash-маршруты, тема shadcn, поле граммов, экран «Список готовок» (создать, открыть, удалить).

## Зависимости
01.

## Задачи
- [x] `pnpm add zustand react-router nanoid`.
- [x] `src/store/id.ts` — `newId()` поверх `nanoid()`.
- [x] `src/store/store.ts` — состояние и действия из ARCHITECTURE §5.1; `createCooking` подставляет `settings.defaultPeople` как порции и создаёт пустой ингредиент.
- [x] `src/store/migrations.ts` — `CURRENT_VERSION = 1`, механизм применения шагов, обработка ошибок чтения (резервный ключ + флаг для баннера).
- [x] `src/store/__tests__/migrations.test.ts` — пустое хранилище, валидная v1, битый JSON, версия из будущего.
- [x] `src/store/hooks.ts` — `useCooking(id)`, `useCookingResult(id)` (мемоизация `computeCooking`).
- [x] `src/app/router.tsx` — `createHashRouter`: корневой layout с шапкой и `<Outlet />`, маршруты `/`, `/c/:id`, `/settings`; неизвестный путь и несуществующий id → редирект на `/`. `main.tsx` рендерит `<RouterProvider>`.
- [x] `src/app/RootLayout.tsx` — баннер ошибки чтения (`Alert`), `<Outlet />`, `<Toaster />`; шапка — `src/components/ScreenHeader.tsx` («← Готовки», заголовок, ⚙ — `Button` ghost + lucide).
- [x] `shadcn add input label alert alert-dialog sonner card separator field input-group empty item` (через MCP shadcn).
- [x] Тема в `src/index.css`: переменная `--warning`, размеры кнопок и полей ≥ 44 px.
- [x] `src/components/NumberField.tsx` — поверх `Field` + `InputGroup`: черновик-строка в фокусе, `parseGrams`, ошибка под полем, суффикс «г», вне фокуса — значение из стора (`formatInput` в домене + тест).
- [x] `src/screens/CookingList/` — список по `updatedAt` (новые сверху), пустое состояние, «+ Новая готовка» → переход на `#/c/<id>`, удаление через `AlertDialog`.
- [x] `src/screens/Cooking/` — пока заглушка с названием готовки и полем сырого веса первого ингредиента для проверки `NumberField` (наполняется в 04).
- [x] `src/screens/Settings/` — заглушка (наполняется в 03).

## Файлы
`package.json`, `src/store/**`, `src/app/**`, `src/index.css`, `src/components/**`, `src/screens/**`, `src/main.tsx`.

## Definition of Done
- Созданная готовка видна в списке после перезагрузки страницы.
- Ручная порча `localStorage['split-the-portion']` не роняет приложение: появляется баннер, в `localStorage` есть резервный ключ.
- Тесты миграций зелёные; lint/test/build проходят.
- Список готовок без горизонтальной прокрутки на 375 px.

## Способ проверки
- `pnpm lint && pnpm test && pnpm build`.
- Браузер 375 px: пустое состояние → «+ Новая готовка» → переход на экран готовки → «← Готовки» → строка в списке → перезагрузка → строка на месте → удалить.
- DevTools: записать в ключ `{oops` → перезагрузка → баннер, резервный ключ.
- Десктоп: список по центру, ширина ≤ 720 px.
- `NumberField` на временной демо-странице или в заглушке: `1240,5` и `1240.5` принимаются, `12a` — ошибка без стирания текста.
