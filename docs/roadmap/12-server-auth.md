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
- [ ] `pnpm add -D wrangler @cloudflare/vite-plugin` и `pnpm add better-auth hono` + пакет passkey (с Better Auth 1.4 — `@better-auth/passkey`, сверить при установке). Проверить, что `@cloudflare/vite-plugin` работает с Vite 8. Записать в ARCHITECTURE §2.
- [ ] База и конфиг по [CLOUDFLARE.md §3–6](../CLOUDFLARE.md#3-создать-базу-d1):
  - `wrangler d1 create`;
  - `wrangler.jsonc`: `main`, `nodejs_compat`, `run_worker_first: ["/api/*"]`, `d1_databases`, `vars.BETTER_AUTH_URL`;
  - секрет `BETTER_AUTH_SECRET`, `.dev.vars`; `.dev.vars*` и `.wrangler/` в `.gitignore`;
  - скрипты `db:migrate:local`, `db:migrate:remote`, `deploy`.
- [ ] `vite.config.ts` — плагин `cloudflare()`: воркер и локальная D1 внутри `pnpm dev` на 5180. `launch.json` не меняется.
- [ ] `tsconfig.worker.json` (типы из `pnpm wrangler types` → `worker-configuration.d.ts`), ссылка из `tsconfig.json`: `pnpm build` проверяет типы и воркера.
- [ ] `worker/index.ts` — Hono:
  - `csrf()` на всё `/api/*`, кроме `/api/auth/*` (у Better Auth своя проверка `Origin`);
  - `/api/auth/*` → `auth.handler`;
  - `GET /api/me` → `{ user, groups: [{ id, name, role }], defaultGroupId }`;
  - неизвестный `/api/*` → 404 JSON.
- [ ] `worker/auth.ts` — `betterAuth({ database: env.DB, … })`:
  - `emailAndPassword: { enabled: true, minPasswordLength: 8 }` со своими `password.hash/verify` на `node:crypto` `scrypt` с параметрами Better Auth (N 16384, r 16, p 1, ключ 64 байта): чистый JS scrypt не укладывается в 10 мс CPU бесплатного плана (better-auth#8860);
  - `sendResetPassword` **временно** пишет ссылку в `console.log` — владелец пересылает её вручную ([CLOUDFLARE.md §10](../CLOUDFLARE.md#10-ручные-операции)), до рассылок;
  - плагин passkey: `rpID` — хост из `BETTER_AUTH_URL`, `rpName: 'Порции'`;
  - плагин `organization`: роли `owner` и `member`; создавать группы может любой пользователь;
  - `user.additionalFields.defaultGroupId` (строка, может быть `null`);
  - `databaseHooks.user.create.after` — создать организацию «Личная» (`auth.api.createOrganization` с `userId`; `slug` обязателен и уникален — случайный nanoid) и записать её id в `defaultGroupId`;
  - `session: { expiresIn: 60 дней, updateAge: 1 день }` — телефон, неделю пролежавший без сети, не разлогинивается;
  - `rateLimit: { storage: 'database' }` — в памяти воркера лимиты не общие;
  - `trustedOrigins`: рабочий адрес и шаблон адресов превью.
- [ ] `worker/migrations/0001_auth.sql` — SQL, сгенерированный CLI Better Auth, прочитан глазами; `pnpm db:migrate:local`.
- [ ] Клиент `src/account/authClient.ts`: `createAuthClient` из `better-auth/react` (тот же origin), `organizationClient()`, `passkeyClient()`.
- [ ] Стор аккаунта `src/store/account.ts` — отдельный маленький Zustand-стор с `persist` в IndexedDB (ключ `split-the-portion:account`): `user` (`id`, `email`), `groups`, `defaultGroupId`, `activeGroupId`. Это кэш ответа `/api/me` — без сети приложение знает, кто вошёл. Не попадает в копию данных.
- [ ] Экран `#/account` (`src/screens/Account/`) — вкладки «Войти» и «Создать аккаунт» (shadcn `Tabs`, `Field`, `Input`, `Button`):
  - поля с `autocomplete="email"`, `"current-password"` / `"new-password"`, `enterKeyHint`, чтобы iOS предлагала и сохраняла пароль в Связке ключей;
  - «Войти с Face ID» (`signIn.passkey()`), подсказка passkey в поле почты (`autocomplete="username webauthn"`);
  - «Забыли пароль?» → «Ссылку для сброса пришлёт владелец приложения» (временно);
  - ошибки под полями: «Неверная почта или пароль», «Пароль — не короче 8 символов», «Такая почта уже зарегистрирована», «Нет сети — войти можно, когда она появится».
- [ ] Настройки → новый подраздел «Аккаунт» (`#/settings/account`, первым в меню):
  - не вошли — «Войти, чтобы данные были на всех устройствах и в общей группе» → `#/account`;
  - вошли — почта, «Добавить вход по Face ID» (`passkey.addPasskey()`; если уже добавлен — «Face ID добавлен»), «Выйти».
- [ ] Документы: ARCHITECTURE §2, §6 (маршруты, `src/account`), новый §9 «Сервер»; SPEC §2 («Аккаунт»); UX — экраны «Вход» и «Аккаунт», словарь; CLAUDE.md — команды и правила для `worker/`.

## Файлы
`package.json`, `wrangler.jsonc`, `vite.config.ts`, `tsconfig*.json`, `.gitignore`, `worker/**`, `src/account/**`, `src/store/account.ts`, `src/screens/Account/**`, `src/screens/Settings/**`, `src/app/router.tsx`, `docs/**`, `CLAUDE.md`.

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
