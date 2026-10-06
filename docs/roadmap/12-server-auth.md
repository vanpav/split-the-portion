# 12 — Сервер и вход: почта + пароль, Face ID

## Цель
У приложения появляется сервер: тот же воркер Cloudflare, что раздаёт статику, отвечает на `/api/*` и хранит пользователей в D1. Человек может создать аккаунт (почта + пароль), войти, добавить вход по Face ID (passkey) и выйти. При регистрации сервер создаёт личную группу «Личная». Данные пока не синхронизируются (этап 13). Без входа приложение работает как раньше.

## Зависимости
11 — желательно: проверять вход удобнее в установленном приложении. Инструкция по базе — [CLOUDFLARE.md](../CLOUDFLARE.md).

## Решения пользователя
- Сервер — Cloudflare Workers + D1, $0 на бесплатном плане.
- Вход — почта + пароль, поверх — passkey (Face ID). Восстановление доступа письмом — позже, вместе с рассылками ([backlog](backlog.md)).
- Вход необязателен: без аккаунта всё работает локально, как сейчас.
- Группы — плагин `organization` Better Auth: личная группа создаётся при регистрации.

## Задачи
- [x] `pnpm add -D wrangler @cloudflare/vite-plugin` и `pnpm add better-auth @better-auth/passkey hono`. `@cloudflare/vite-plugin` 1.62 поддерживает Vite 8. Записано в ARCHITECTURE §2.
- [x] `wrangler.jsonc`: `main`, `nodejs_compat`, `assets.run_worker_first: ["/api/*"]`, `d1_databases` (binding `DB`, `migrations_dir: worker/migrations`). Вместо `database_id` — рабочей базы (до её создания стояла заглушка: локально id не нужен) ([CLOUDFLARE.md §3](../CLOUDFLARE.md#3-создать-базу-d1)). `BETTER_AUTH_URL` не понадобился: адрес берётся из запроса, поэтому рабочий адрес, превью веток и localhost работают каждый под своим.
- [x] Локальный секрет — `.dev.vars` (`.dev.vars*` и `.wrangler/` в `.gitignore`). Скрипты `db:migrate:local`, `db:migrate:remote`, `db:auth-schema`, `deploy`.
- [x] `vite.config.ts` — плагин `cloudflare()`: воркер и локальная D1 внутри `pnpm dev` и `pnpm preview`; в тестах (`VITEST`) не подключается. Сборка: `dist/client` (статика и Service Worker) и `dist/split_the_portion` (воркер, 435 КБ gzip).
- [x] `tsconfig.worker.json` (типы из `pnpm wrangler types` → `worker-configuration.d.ts`, коммитится: сборка в Cloudflare проверяет типы без `.dev.vars`), ссылка из `tsconfig.json`.
- [x] `worker/index.ts` — Hono: `csrf()`, экземпляр Better Auth на адрес (создаётся один раз на изолят), `/api/auth/*` → `auth.handler`, `GET /api/me` → `{ user, groups, defaultGroupId }`, неизвестный `/api/*` → 404 JSON.
- [x] `worker/auth.ts` — `authOptions(origin)` (общие с генератором схемы) и `createAuth(env, origin)`:
  - почта + пароль, не короче 8 символов. **Свой хеш не понадобился:** Better Auth 1.7 (`@better-auth/utils` 0.4+) для workerd сам берёт нативный `node:crypto` scrypt — в сборке воркера `import { scrypt } from "node:crypto"`, чистого JS scrypt нет;
  - `sendResetPassword` временно пишет ссылку в лог воркера;
  - плагин passkey (`rpID` — хост из запроса, `rpName: 'Порции'`), `organization`, `user.additionalFields.defaultGroupId`;
  - `databaseHooks.user.create.after` — группа «Личная» (`auth.api.createOrganization` с `userId`, `slug` — nanoid);
  - сессия 60 дней с продлением раз в сутки, `rateLimit` в базе, телеметрия выключена.
- [x] `worker/me.ts` — группы пользователя по дате вступления; группа по умолчанию — выбранная, пока человек в ней, иначе первая (`defaultGroupOf`, тест `worker/__tests__/me.test.ts`). Поэтому `defaultGroupId` при регистрации записывать не нужно.
- [x] `worker/migrations/0001_auth.sql` — `pnpm -s db:auth-schema` (`scripts/auth-schema.mjs`: Better Auth `getMigrations` сравнивает конфиг с локальной D1 через `getPlatformProxy` и печатает недостающий SQL). `node:sqlite` в Node 22.12 для этого не годится. Применено `pnpm db:migrate:local`, повторный запуск схемы — пусто.
- [x] Клиент: `src/account/authClient.ts` (`createAuthClient` с `organizationClient`, `passkeyClient`), `authErrors.ts` (тексты ошибок по словарю UX), `refreshAccount.ts`, `types.ts` (общий с воркером тип `Me`).
- [x] `src/store/account.ts` — стор аккаунта с `persist` в IndexedDB (`split-the-portion:account`), `accountReady`. `main.tsx` рендерит после данных и аккаунта; если кто-то вошёл — переспрашивает `/api/me` (без сети остаётся кэш). `activeGroupId` — в этапе 13, когда понадобится.
- [x] Экран `#/account` — `Tabs` (`shadcn add tabs`) «Войти / Создать аккаунт»; поля с `autocomplete` для Связки ключей; «Войти с Face ID»; «Забыли пароль?» → «Ссылку для нового пароля пришлёт владелец приложения». Свои русские ошибки вместо всплывающих подсказок браузера (`noValidate`).
- [x] Экран `#/account/reset` — новый пароль по ссылке из лога. Better Auth кладёт `token` в настоящую строку запроса (`/?token=…#/account/reset`), экран берёт его оттуда и убирает из адреса после смены.
- [x] Настройки → «Аккаунт» (`#/settings/account`, первым в меню; в меню на телефоне вместо подписи — почта): не вошли — «Войти»; вошли — почта, «Добавить вход по Face ID» / «Face ID добавлен» (`useListPasskeys`), «Выйти» (только с сетью: сессия должна закончиться на сервере).
- [x] Документы: ARCHITECTURE §2, §6, §9; UX — «Настройки», «Вход», словарь; CLOUDFLARE.md — без `BETTER_AUTH_URL`, схема через `db:auth-schema`; CLAUDE.md — команды.
- [x] Превью: деплой превью получает только привязки блока `previews`, а секреты `wrangler secret put` / `preview secret put` / базового конфига следующая сборка затирает. Поэтому в блоке — та же `DB` и `PREVIEW_AUTH_SECRET` из Secrets Store (хранилище `split-the-portion`); воркер берёт `BETTER_AUTH_SECRET`, иначе — хранилище. Без базы или секрета воркер отвечает `{"error":"misconfigured"}` — иначе Better Auth тихо держит аккаунты в памяти.
- [x] Рабочая база (2026-10-06): `pnpm wrangler login` (аккаунт vanpav@gmail.com) → `pnpm wrangler d1 create split-the-portion` (регион WEUR) → `database_id` в `wrangler.jsonc` → `pnpm wrangler secret put BETTER_AUTH_SECRET` (случайные 32 байта) → `pnpm db:migrate:remote` ([CLOUDFLARE.md §2–6](../CLOUDFLARE.md)).
- [ ] На iPhone по превью-деплою: регистрация, Связка ключей предлагает сохранить пароль, «Добавить вход по Face ID», выход, «Войти с Face ID»; `pnpm wrangler tail` — `sign-up` и `sign-in` с исходом `Ok`.

## Файлы
`package.json`, `wrangler.jsonc`, `worker-configuration.d.ts`, `vite.config.ts`, `tsconfig*.json`, `.gitignore`, `scripts/auth-schema.mjs`, `worker/**`, `src/account/**`, `src/store/account.ts`, `src/screens/Account/**`, `src/screens/Settings/**`, `src/components/ui/tabs.tsx`, `src/app/router.tsx`, `src/app/paths.ts`, `src/main.tsx`, `docs/**`, `CLAUDE.md`.

## Definition of Done
- Регистрация создаёт пользователя и группу «Личная» с ним во владельцах; `defaultGroupId` указывает на неё.
- Вход паролем и выход работают; сессия переживает перезапуск приложения.
- На рабочем адресе с iPhone: «Добавить вход по Face ID» → выйти → «Войти с Face ID» → вошли.
- Регистрация и вход на бесплатном плане укладываются в лимит CPU (в логе нет `exceededCpu`).
- Без входа всё работает как до этапа: калькулятор, сохранение, настройки.
- `pnpm lint && pnpm test && pnpm build` проходят (включая типы воркера).

## Способ проверки
- `pnpm dev` → `#/account` → «Создать аккаунт» → `pnpm wrangler d1 execute split-the-portion --local --command "select u.email, o.name, m.role from member m join user u on u.id = m.userId join organization o on o.id = m.organizationId"` → строка «…@… | Личная | owner».
- Перезагрузка → в Настройках → «Аккаунт» та же почта; «Выйти» → «Войти»; неверный пароль → «Неверная почта или пароль».
- Превью-деплой на iPhone: регистрация, Связка ключей предлагает сохранить пароль; «Добавить вход по Face ID»; выход; вход по Face ID. `pnpm wrangler tail` — запросы `sign-up` и `sign-in` с исходом `Ok`.
- `curl -X POST` на `/api/auth/sign-in/email` с чужим `Origin` → 403: запрос с другого сайта не проходит.
- 375 px и десктоп: экран входа без горизонтальной прокрутки, поля ≥ 44 px, шрифт ≥ 16 px; консоль чистая.

## Проверено
Локально (`pnpm dev`, воркер и D1 внутри Vite), 375 px и 1280 px:
- `/api/auth/ok` → 200, `/api/me` без входа → 401, `/api/nope` → 404 JSON;
- Настройки → «Аккаунт» → «Войти» → «Создать аккаунт»: пароль из 5 символов → «Пароль — не короче 8 символов»; нормальный → вернулись в «Аккаунт» с почтой; `/api/me` — группа «Личная», `owner`, она же по умолчанию; в D1 хеш `соль:ключ` в формате Better Auth;
- «Выйти» → `/api/me` 401; неверный пароль → «Неверная почта или пароль»; «Забыли пароль?» → подпись про владельца, ссылка в логе воркера → «Новый пароль» → тост «Пароль изменён — войдите с ним» → вход с новым паролем → перезагрузка: вход сохранён;
- горизонтальной прокрутки нет; в консоли только сетевые 401/404 от проверочных запросов.

Face ID во встроенном браузере не проверялся — только на iPhone (задача выше).
