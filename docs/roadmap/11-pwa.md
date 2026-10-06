# 11 — PWA: установка на iPhone и работа без сети

## Цель
Приложение ставится на экран «Домой» iPhone и открывается как отдельное приложение: без строки Safari, со своей иконкой, **без сети**. Новая версия не подменяет старую молча: появляется тост «Есть новая версия · Обновить». Сервер для этого не нужен, польза сразу.

## Зависимости
10. Деплой на Cloudflare Workers уже есть (`wrangler.jsonc`), HTTPS — тоже: без него Service Worker не работает.

## Решения пользователя
- PWA через `vite-plugin-pwa` (вопрос ARCHITECTURE §8 закрыт): Workbox и манифест, свой Service Worker не пишем.
- Обновление по кнопке, а не тихо: тихая перезагрузка может стереть ввод в калькуляторе.

## Задачи
- [x] `pnpm add -D vite-plugin-pwa @vite-pwa/assets-generator workbox-build` (у плагина v2 `workbox-build` — peer) и `pnpm add workbox-window`. Плагин v2.0.0 поддерживает Vite 8. Записано в ARCHITECTURE §2.
- [x] `vite.config.ts` — `VitePWA({ registerType: 'prompt', … })`:
  - манифест: `name` и `short_name` «Порции», `lang: 'ru'`, `display: 'standalone'`, `start_url: '/'`, `scope: '/'`, `theme_color` и `background_color` — из токенов `index.html` (`#f2f5f9`);
  - Workbox: precache всей сборки (`js`, `css`, `html`, `svg`, `png`, `woff2` — шрифт Rubik приходит из `@fontsource-variable`), `navigateFallback: 'index.html'`, `navigateFallbackDenylist: [/^\/api\//]` — задел под этап 12, API никогда не кешируется.
- [x] Иконки из `public/favicon.svg` через `@vite-pwa/assets-generator` (`pnpm icons`, `pwa-assets.config.ts`), пресет `minimal-2023` без отступов: 64, 192, 512, maskable 512, `apple-touch-icon` 180, `favicon.ico`. PNG коммитим в `public/`. В `favicon.svg` был логотип Vite — нарисован ланчбокс на `cobalt`, поделённый на два цвета крышек 54 : 46. Позже его сменила стопка ланчбоксов с брокколи и морковью на `navy-ink`; maskable теперь с отступом (ARCHITECTURE §7).
- [x] `index.html`: `<link rel="apple-touch-icon">`, `<meta name="apple-mobile-web-app-title" content="Порции">`, `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="default">`. `viewport-fit=cover` уже есть; проверить отступы `env(safe-area-inset-*)` у нижнего меню и `BottomBar` в standalone.
- [x] `public/_headers` (Workers static assets): `/sw.js` и `/manifest.webmanifest` с `Cache-Control: no-cache` — иначе обновление не доходит.
- [x] `src/app/UpdatePrompt.tsx` — `useRegisterSW` из `virtual:pwa-register/react`. При `needRefresh` — тост sonner без автозакрытия: «Есть новая версия» и действие «Обновить» (`updateServiceWorker(true)`). Рендерится в `RootLayout`. Типы: `vite-plugin-pwa/react` в `tsconfig.app.json`. Приложение с экрана «Домой» не перезагружается, а возвращается, поэтому проверяем обновление при каждом `visibilitychange` → видно.
- [x] Настройки → «Копия данных»: подпись про iPhone — «У приложения на экране „Домой“ своё хранилище, не общее с Safari. Перенести данные — „Скачать“ в Safari, „Загрузить“ в приложении». Убрать после этапа 13.
- [x] Precache без арабского и иврита из Rubik (`globIgnores`): в русском интерфейсе браузер их не запрашивает.
- [x] `.claude/launch.json` — конфигурация `preview` (`pnpm preview`, порт 4180) для проверки сборки.
- [x] Документы: ARCHITECTURE §2, §6 (`UpdatePrompt`), §7 (PWA, иконка), §8; UX — поток «П5. Установить на iPhone», подпись в «Копии данных», словарь §6; CLAUDE.md — `pnpm icons`, проверка PWA; backlog — строка «PWA + офлайн» убрана.

## Файлы
`package.json`, `vite.config.ts`, `pwa-assets.config.ts`, `index.html`, `public/` (иконки, `_headers`), `tsconfig.app.json`, `tsconfig.node.json`, `.claude/launch.json`, `src/app/UpdatePrompt.tsx`, `src/app/RootLayout.tsx`, `src/screens/Settings/DataSection.tsx`, `docs/**`.

## Definition of Done
- В Safari на iPhone «Поделиться → На экран „Домой“» ставит «Порции» со своей иконкой; приложение открывается без интерфейса Safari.
- В авиарежиме установленное приложение открывается, калькулятор считает, готовка сохраняется и видна после перезапуска.
- После деплоя новой версии при следующем открытии появляется тост «Есть новая версия · Обновить»; «Обновить» перезагружает в новую версию; без нажатия ничего не меняется.
- `pnpm lint && pnpm test && pnpm build` проходят; в сборке есть `manifest.webmanifest` и `sw.js`.

## Способ проверки
- `pnpm build && pnpm preview`, Chrome DevTools → Application: манифест без ошибок, Service Worker активен, Cache Storage содержит сборку; Network → Offline → перезагрузка → приложение открывается.
- Превью-деплой ветки на iPhone (Safari): установить на экран «Домой», авиарежим, пример 1 SPEC §11 (гречка 200 г, «Кастрюля» 850 г, вес с тарой 1410 → 560 г без тары, k = 2,8) → «Сохранить» → закрыть приложение из переключателя → открыть → готовка на месте.
- Поменять любую подпись, задеплоить ещё раз → открыть установленное приложение → тост → «Обновить» → новая подпись.
- 375 px и десктоп: тост не перекрывает клавиатуру калькулятора (тосты сверху); консоль чистая.

## Проверено
Сборка (`pnpm build`, `pnpm preview` на 4180) во встроенном браузере:
- манифест «Порции», Service Worker активен, в precache 20 файлов (841 КБ): сборка, шрифты Rubik (латиница и кириллица), иконки;
- после пересборки при перезагрузке — тост «Есть новая версия · Обновить»; «Обновить» перезагрузил страницу на новую версию, ожидающего Service Worker не осталось;
- **сервер остановлен** → перезагрузка: приложение открылось, шрифт Rubik на месте; на 375 px «Добавить популярные блюда» → «Гречка» → 5-6-0 → «Готовый 560 г, k = 2,8» (пример 1 SPEC §11) → «Сохранить» → перезагрузка без сервера → в «Истории» «200 г сухого · 560 г готового · k 2,8»; горизонтальной прокрутки нет; консоль чистая.

Осталось проверить на iPhone (превью-деплой PR): «На экран „Домой“», иконка, открытие в авиарежиме, тост после следующего деплоя.
