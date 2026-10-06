# 01 — Фундамент и расчётное ядро

## Цель
Отдельный репозиторий, чистый шаблон и надёжный расчётный модуль `src/domain`, покрытый тестами по эталонным примерам SPEC §11. UI на этом этапе не делаем.

## Зависимости
Нет. Документы SPEC / ARCHITECTURE одобрены.

## Задачи

### Репозиторий и шаблон
- [x] **Спросить подтверждение** и выполнить `git init` в папке проекта (она внутри репозитория `~/Projects`).
- [x] Проверить `.gitignore` (`node_modules`, `dist`, `.DS_Store`, `*.local`).
- [x] Удалить демо шаблона: `src/App.css`, `src/assets/*`, лишнее из `public/`, содержимое `src/App.tsx` → заглушка «Split the Portion».
- [x] `index.html`: `lang="ru"`, `<title>Порции</title>`, `viewport` с `width=device-width, initial-scale=1`.
- [x] Переписать `README.md` коротко: что это и ссылки на docs.
- [x] `pnpm add -D vitest`; скрипты `test` и `test:watch`; блок `test` в `vite.config.ts` (`environment: 'node'`, `include: ['src/**/*.test.ts']`).
- [x] `.claude/launch.json` с конфигурацией `dev` (pnpm dev, порт 5180).
- [x] Tailwind v4 (`tailwindcss`, `@tailwindcss/vite`) и `pnpm dlx shadcn@latest init` по гайду для Vite: алиас `@/`, `src/index.css` с темой, `src/lib/utils.ts`, `components.json`. Сначала проверить совместимость CLI с Vite 8 / TS 6; если не встаёт — остановиться и спросить.
- [x] Добавить пробный `Button` (`shadcn add button`) в заглушку, чтобы проверить, что стили применяются.

### Домен (`src/domain`)
- [x] `types.ts` — модель из ARCHITECTURE §3 и типы результатов §4.
- [x] `numbers.ts` — `parseGrams`, `roundHalfUp`, `formatGrams`, `formatK`, `formatPercent` + `numbers.test.ts`.
- [x] `weighing.ts` — `foodGrams` (с тарой / без тары, ошибка «вес с тарой ≤ тара»).
- [x] `cooking.ts` — `computeCooking`: базовый ингредиент, этапы `A_j`, доли порций, готовые и сырые значения, остаток, k.
- [x] `reconcile.ts` — сверка: база (сырой/готовый), `diff`, статус `ok | over | under | incomplete`.
- [x] `remainder.ts` — `fillRemainder`.
- [x] `split.ts` — `splitEqual` методом наибольшего остатка + `split.test.ts`.
- [x] `copyText.ts` — текст для трекера (SPEC §9).
- [x] `validation.ts` — предупреждения SPEC §8 (диапазон k, все ингредиенты исключены, порция без базы).
- [x] `index.ts` — публичный API.
- [x] `__tests__/examples.test.ts` — все строки таблиц 1.x, 2.x, 3.x из SPEC §11.
- [x] `__tests__/cooking.test.ts` — граничные случаи SPEC §8: нет готового веса, пустые порции, удалённый ингредиент-база, нулевой сырой вес, 0 ингредиентов.

## Файлы
`.gitignore`, `index.html`, `README.md`, `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig*.json`, `components.json`, `.claude/launch.json`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, удаление `src/App.css` и `src/assets/`, новые `src/domain/**`.

## Definition of Done
- Отдельный git-репозиторий, первый коммит с чистым шаблоном и документами.
- `pnpm test` зелёный, все эталонные примеры SPEC §11 покрыты (каждая строка таблицы — свой `it`, номер строки в названии теста).
- `src/domain` не импортирует ничего из React, DOM и стора (проверить grep'ом).
- `pnpm lint` и `pnpm build` без ошибок.
- Документы обновлены, если по ходу поменялось API домена.

## Способ проверки
- `pnpm lint && pnpm test && pnpm build`.
- `grep -rE "from 'react|localStorage|document\.|window\." src/domain` → пусто.
- `pnpm dev`: страница-заглушка с кнопкой shadcn открывается на 375 px и на десктопе, стили Tailwind применились, консоль чистая.
