# Сервер и база на Cloudflare

Статус: инструкция к этапам [12](roadmap/12-server-auth.md)–[14](roadmap/14-groups.md) · 2026-10-06. Как устроены сервер и синхронизация — [ARCHITECTURE §9–10](ARCHITECTURE.md#9-сервер). Цены и лимиты проверены в октябре 2026, перед оплатой сверить со ссылками в конце.

## 1. Где держать базу и сколько это стоит

Наша нагрузка крошечная: несколько человек, у каждого десятки блюд и сотни готовок, объём — килобайты. Одна правка на сервере — это 2–3 записанные строки (счётчик группы, запись, индекс). Даже 10 активных людей — это сотни записанных строк в день. Любой бесплатный тариф ниже покрывает это с запасом в сотни раз. Выбирать стоит по тому, сколько своего кода и забот добавится.

| Где | Бесплатно | Платно | Минусы для нас |
|---|---|---|---|
| **Cloudflare Workers + D1** (выбор) | D1: 5 млн чтений строк и 100 тыс. записей строк в день, 5 ГБ, Time Travel 7 дней. Workers: 100 тыс. запросов в день, 10 мс CPU на запрос | Workers Paid **$5/мес**: 25 млрд чтений и 50 млн записей строк в месяц, 5 ГБ, CPU до 30 с на запрос, Time Travel 30 дней | 10 мс CPU мало для хеша пароля (обходим нативным scrypt, §14); обновлений в реальном времени из коробки нет |
| **Turso** (libSQL) | 5 ГБ, 500 млн чтений и 10 млн записей строк в месяц, 100 баз; восстановление — на 1 день назад | от $4,99/мес | Отдельный сервис и токены. API для приложения всё равно где-то нужно держать (тот же воркер) |
| **Supabase** (Postgres + Auth) | 500 МБ, 50 тыс. активных пользователей в месяц, 2 проекта | Pro $25/мес | Бесплатный проект **засыпает после 7 дней без запросов**, будить — вручную в панели. Офлайн-синхронизации нет, нужен ещё один сервис (PowerSync) |
| **Firebase** (Firestore + Auth) | Spark: 1 ГиБ, 50 тыс. чтений и 20 тыс. записей документов в день | Blaze — по факту использования | Стор пришлось бы переписать под Firestore. Вход через Google в установленной на iPhone PWA капризный. Привязка к Google |
| **VPS + PocketBase / SQLite** | — | ~$4–6/мес | Обновления, резервные копии и HTTPS — на нас |

**Почему Cloudflare.**
- Приложение уже деплоится туда как статика (`wrangler.jsonc`). API и база добавляются в тот же воркер, на тот же домен: cookie входа работают в PWA без CORS.
- На бесплатном плане это **$0**.
- Резервные копии (Time Travel) есть из коробки.

**Когда платить $5/мес за Workers Paid:**
- регистрация или вход падают с Error 1102: хеш пароля не уложился в 10 мс CPU (§14);
- приложением пользуются больше чем на 100 тыс. запросов в день — для нас нереально;
- понадобится отправка писем через Cloudflare (§13) или откат базы дальше чем на 7 дней.

## 2. Подготовка

Аккаунт Cloudflare уже есть: приложение деплоится как воркер `split-the-portion`.

```bash
pnpm install
```

`wrangler` и `@cloudflare/vite-plugin` уже в `devDependencies` (этап 12).

```bash
pnpm wrangler login
```

```bash
pnpm wrangler whoami
```

`login` откроет браузер, `whoami` покажет аккаунт. Если аккаунтов несколько, запомните `account_id` — его можно вписать в `wrangler.jsonc`.

## 3. Создать базу D1

```bash
pnpm wrangler d1 create split-the-portion
```

Wrangler напечатает блок с `database_id` и предложит сам дописать его в `wrangler.jsonc`. Отказаться: он предложит привязку `split_the_portion`, а у нас `DB` — id вписываем руками в готовый блок `d1_databases`. `database_id` не секрет, он хранится в репозитории. Сделано 2026-10-06: база `split-the-portion`, регион WEUR.

## 4. Привязать базу к воркеру

`wrangler.jsonc` после этапа 12:

```jsonc
{
  // Cloudflare Workers: the built app as static files, /api/* handled by worker/index.ts.
  "name": "split-the-portion",
  "main": "worker/index.ts",
  "compatibility_date": "2026-10-01",
  // node:crypto for Better Auth: its password hash runs natively in workerd instead of slow pure JS.
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    // Only the API runs code; everything else is served as files (hash routes: the server only sees `/`).
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "split-the-portion",
      "database_id": "9ddc8c02-9162-4f45-929b-248ca1391a47",
      "migrations_dir": "worker/migrations"
    }
  ],
  "previews": {}
}
```

- `not_found_handling` не нужен: маршруты приложения в hash (`#/d/…`), сервер видит только `/`.
- Адрес приложения в конфиге не нужен: воркер берёт его из запроса. Поэтому рабочий адрес, превью веток и `localhost` работают каждый под своим. Passkey (Face ID) привязан к тому адресу, где его добавили.
- Сборка с `@cloudflare/vite-plugin` кладёт статику в `dist/client`, воркер и итоговый конфиг — в `dist/split_the_portion`; `wrangler deploy` подхватывает его сам (`.wrangler/deploy/config.json`).
- Типы окружения (`Env` с `DB`) генерирует `pnpm wrangler types` — запускать после каждой правки `wrangler.jsonc`.

## 5. Миграции базы

Миграции — обычные SQL-файлы в `worker/migrations/`, применяются по порядку и только один раз. Wrangler помнит применённые в таблице `d1_migrations`.

| Файл | Что внутри | Этап |
|---|---|---|
| `0001_auth.sql` | Таблицы Better Auth: `user`, `session`, `account`, `verification`, `passkey`, `organization`, `member`, `invitation`, лимиты частоты | 12 |
| `0002_sync.sql` | `record`, `group_clock` | 13 |
| `0003_invites.sql` | `group_invite` | 14 |

SQL для таблиц Better Auth печатает `pnpm -s db:auth-schema` (`scripts/auth-schema.mjs`). Скрипт сравнивает конфиг `worker/auth.ts` с локальной базой и выводит только недостающее. Поэтому сначала применить существующие миграции локально. Файл перед применением прочитать глазами.

```bash
pnpm db:migrate:local
```

```bash
pnpm -s db:auth-schema > worker/migrations/NNNN_auth.sql
```

Свои таблицы (`record`, `group_invite`) — обычные файлы, их пишем руками. Пустой файл с номером создаёт:

```bash
pnpm wrangler d1 migrations create split-the-portion sync
```

```bash
pnpm wrangler d1 migrations apply split-the-portion --local
```

```bash
pnpm wrangler d1 migrations apply split-the-portion --remote
```

```bash
pnpm wrangler d1 migrations list split-the-portion --remote
```

Порядок такой: сначала `--local` и проверка в `pnpm dev`, потом `--remote` — **до** деплоя кода, которому нужны новые таблицы. Локальная база (`.wrangler/state`) и удалённая — разные, данные между ними не ходят.

Скрипты в `package.json`: `db:migrate:local`, `db:migrate:remote`, `db:auth-schema`, `deploy`.

## 6. Секреты и переменные

| Имя | Где | Что |
|---|---|---|
| `BETTER_AUTH_SECRET` | секрет | Подписывает cookie сессий. Случайные 32 байта; сменить — значит разлогинить всех |

```bash
openssl rand -base64 32
```

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET
```

Wrangler спросит значение — вставить строку из `openssl`. Секрет можно задать и в панели: Workers → split-the-portion → Settings → Variables and Secrets.

Локально секреты лежат в `.dev.vars` в корне проекта. Это свой, локальный секрет, не продакшен:

```
BETTER_AUTH_SECRET=<другая случайная строка>
```

`.dev.vars*` и `.wrangler/` (локальная D1 и состояние воркера) — в `.gitignore`.

## 7. Локальная разработка

- `pnpm dev`: благодаря `@cloudflare/vite-plugin` воркер и локальная D1 работают внутри того же Vite на порту 5180. Отдельный `wrangler dev` не нужен.
- Заглянуть в локальную базу:

```bash
pnpm wrangler d1 execute split-the-portion --local --command "select id, email from user"
```

- Вход на телефоне через `pnpm dev --host` (`http://192.168.…`) **не заработает**: cookie сессии `Secure` и Face ID (WebAuthn) требуют HTTPS. Всё, что связано со входом, проверяем на превью-деплое (§8). Без входа приложение по LAN работает как раньше.

## 8. Деплой

**Из терминала:**

```bash
pnpm db:migrate:remote
```

```bash
pnpm run deploy
```

Именно `pnpm run deploy`: голое `pnpm deploy` — встроенная команда pnpm для монорепозиториев.

**Через Git (Workers Builds).** Если воркер подключён к GitHub в панели Cloudflare, сборка идёт сама на каждый push:
- команда сборки — `pnpm build`;
- команда деплоя — `pnpm wrangler deploy`.

Миграции в команду деплоя **не** добавлять: превью веток собираются той же сборкой и накатили бы недоделанную схему на рабочую базу. Миграции применяем руками (`pnpm db:migrate:remote`) перед слиянием PR, которому они нужны.

**Превью веток** (`"previews": {}`) получают свой адрес. На превью:
- база та же, рабочая, — не экспериментировать с удалением данных;
- passkey, созданный на адресе превью, к рабочему адресу не подходит;
- адрес превью отдельно разрешать не нужно: воркер доверяет адресу, на который пришёл запрос.

## 9. Проверить, что всё работает

```bash
curl -i https://split-the-portion.<поддомен>.workers.dev/api/auth/ok
```

Ответ `200` и `{"ok":true}`.

```bash
pnpm wrangler tail split-the-portion --format pretty
```

Живой лог воркера: зарегистрироваться в приложении и смотреть, что запросы `/api/auth/sign-up/email` и `/api/auth/sign-in/email` завершаются `Ok`, а не `exceededCpu`. Время CPU по запросам видно в панели: Workers → split-the-portion → Observability.

## 10. Ручные операции

Все команды — `pnpm wrangler d1 execute split-the-portion --remote --command "<SQL>"`. Имена колонок Better Auth — в camelCase.

| Что | SQL |
|---|---|
| Пользователи | `select id, email, createdAt from user order by createdAt` |
| Группы и участники | `select o.name, u.email, m.role from member m join organization o on o.id = m.organizationId join user u on u.id = m.userId order by o.name` |
| Что лежит в группе | `select type, count(*) from record where group_id = '<id>' and deleted = 0 group by type` |
| Убрать человека из группы | `delete from member where userId = '<id>' and organizationId = '<id>'` |
| Отозвать код приглашения | `update group_invite set revoked = 1 where code = '<код>'` |

**Забыли пароль (пока нет писем).**
1. Сначала попробовать войти по Face ID, если его добавляли.
2. Если нет — в приложении «Забыли пароль?». Воркер не отправляет письмо, а пишет ссылку сброса в свой лог (временная настройка этапа 12).
3. Ссылку берём из `pnpm wrangler tail` и пересылаем человеку лично. Ссылка одноразовая и живёт час.

## 11. Резервные копии и восстановление

**Time Travel** — D1 сама хранит историю: 7 дней на бесплатном плане, 30 дней на платном.

```bash
pnpm wrangler d1 time-travel info split-the-portion
```

```bash
pnpm wrangler d1 time-travel restore split-the-portion --timestamp=<unix-время>
```

`restore` **перезаписывает базу целиком** на момент времени. Всё, что записано позже, пропадёт на сервере. Телефоны сами заметят, что их курсор впереди часов группы, и перечитают группу с нуля; неотправленные изменения они дошлют. Записи, которые уже дошли до телефонов, но пропали на сервере, на телефонах останутся до следующей правки.

**Выгрузка в файл** — раз в неделю или перед рискованной миграцией:

```bash
pnpm wrangler d1 export split-the-portion --remote --output ~/Backups/split-the-portion-2026-10-06.sql
```

Файл содержит почты и данные пользователей. Храним **вне репозитория**.

Кроме этого, у каждого в приложении остаётся «Настройки → Копия данных» — JSON-файл одной группы.

## 12. Свой домен (по желанию)

- Нужен для писем (§13) и для красивого адреса. Cloudflare Registrar продаёт домены по себестоимости: `.com` — около $10 в год; `.ru` там не продаётся.
- Подключение: Workers → split-the-portion → Settings → Domains & Routes → Add → Custom domain. Адрес в конфиге менять не нужно.
- **Делать до того, как люди добавят Face ID.** Passkey привязан к домену. После переезда все входят паролем и добавляют Face ID заново.
- Установленная PWA привязана к адресу. После переезда:
  1. на старом адресе открыть приложение и дождаться «Синхронизировано»;
  2. удалить иконку с экрана «Домой»;
  3. установить приложение с нового адреса и войти — данные придут с сервера.

## 13. Письма (позже: подтверждение почты, сброс пароля)

| Сервис | Бесплатно | Платно | Нужно |
|---|---|---|---|
| **Cloudflare Email Sending** (публичная бета с апреля 2026) | — | Только на Workers Paid ($5/мес): 3 000 писем в месяц включено, дальше $0,35 за 1 000 | Домен на Cloudflare; привязка `send_email` в `wrangler.jsonc` |
| **Resend** | 3 000 писем в месяц, 100 в день | от $20/мес | Подтвердить домен DNS-записями |

В обоих случаях нужен свой домен и DNS-записи SPF и DKIM: без них письма уходят в спам. В Better Auth письма подключаются через `sendResetPassword` и `sendVerificationEmail` — вместо записи в лог из §10.

## 14. Частые проблемы

| Симптом | Причина | Что делать |
|---|---|---|
| Регистрация падает, в логе `exceededCpu` / Error 1102 | Хеш пароля дольше 10 мс CPU. Чистый JS scrypt тратит 70–170 мс; Better Auth 1.7 под workerd берёт нативный `node:crypto` | Проверить флаг `nodejs_compat` и что в сборке воркера `import { scrypt } from "node:crypto"`. Если не помогло — Workers Paid $5 |
| `no such table: record` после деплоя | Миграцию применили только `--local` | `pnpm db:migrate:remote` |
| Вход не держится на телефоне | Открыто по `http://` (LAN) — cookie `Secure` не сохраняется | Проверять вход на HTTPS: превью или рабочий адрес |
| «Войти с Face ID» ничего не делает | Не HTTPS, или адрес не совпадает с `rpID` (превью, другой домен) | Рабочий адрес; на новом адресе добавить Face ID заново |
| После деплоя на телефоне старая версия | Service Worker отдаёт закешированную сборку | Нажать «Обновить» в тосте «Есть новая версия». Проверить, что `public/_headers` отдаёт `/sw.js` с `no-cache` |
| На iPhone после установки пусто | У PWA на экране «Домой» своё хранилище, не общее с Safari | Войти — данные придут с сервера; без аккаунта — «Копия данных» |
| `403` на `/api/groups/…/sync` | Человек не участник группы (вышел или его убрали) | Приложение само убирает группу с устройства и открывает группу по умолчанию; проверить `member` (§10) |
| `pnpm dev` перестал отвечать на `/api/*` | Миграция применена к локальной базе, пока dev-сервер держал её открытой, или воркер много раз горячо перезагрузился | Перезапустить `pnpm dev` |

## Источники

- [D1: цены и лимиты](https://developers.cloudflare.com/d1/platform/pricing/) · [D1: Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) · [Workers: лимиты](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Email Sending — публичная бета](https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/)
- [Better Auth 1.5: D1 напрямую](https://better-auth.com/blog/1-5) · [better-auth#8860: CPU при регистрации на Workers](https://github.com/better-auth/better-auth/issues/8860)
- [Supabase: бесплатный тариф](https://uibakery.io/blog/supabase-pricing) · [Turso: бесплатный тариф](https://costbench.com/software/database-as-service/turso/free-plan/)
