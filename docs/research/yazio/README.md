# Исследование: перенос блюд в Yazio

Issue [#49](https://github.com/vanpav/split-the-portion/issues/49), часть 1 (Yazio). Дата исследования — **2026-10-06**. Всё собрано по открытым источникам: в Yazio не входили, к API запросов не делали, сторонний код не запускали. Что не подтверждено источником, помечено «не проверено». Что можно проверить только с аккаунтом Yazio и на телефоне, вынесено в [«Проверить руками»](#5-проверить-руками).

## 1. Коротко

- **Официального API у Yazio нет.** Нет ни портала для разработчиков, ни ключей; партнёрская программа — только для партнёров по рекламе и блогеров ([1](#src-apis), [2](#src-partner)).
- **Неофициальный API умеет всё, что нам нужно** (по описаниям, собранным из трафика приложения): поиск продуктов с признаком `is_verified` (синяя галочка), создание, правка и удаление своих рецептов с id, запись в дневник порции рецепта (`recipe_id` + `portion_count`) или продукта в граммах ([3](#src-spec)).
- **Но вход в него — только паролем пользователя от Yazio** и учётными данными самого приложения Yazio; сервер пропускает только известные версии приложения по `User-Agent`. То есть мы выдаём себя за приложение Yazio. Условия использования это, скорее всего, запрещают (прочитать их не удалось: справка отдаёт 403), версия API менялась v15 → v20 → v22 за два года. Риски: блокировка аккаунта (случаев не нашли, не проверено), поломка без предупреждения.
- **Обходных путей без API нет:** ссылок `yazio://` с готовым рецептом не нашли, Apple Health питание из чужих приложений в Yazio не заводит (и из PWA Health недоступен), импорт рецепта по ссылке — источники противоречат друг другу.
- **Рекомендация: пока не делаем, оставляем «Копировать».** Если риск устраивает — делать как личный экспериментальный режим через воркер, по шагам: сначала перенос порции **продуктами по сырому весу** (точно, без рецептов и дублей), рецепт в Yazio — вторым шагом. До кода — пройти [«Проверить руками»](#5-проверить-руками) и написать в поддержку Yazio про доступ к API.

## 2. Варианты

| Вариант | Создать рецепт | Найти свой рецепт / id | Поиск продуктов, признак проверенного | Запись в дневник | Как входит | Из PWA на iPhone | Риски | Работа |
|---|---|---|---|---|---|---|---|---|
| **Официальный API / партнёрство** | — | — | — | — | Нет программы ([1](#src-apis), [2](#src-partner)). Просьба открыть API висит на форуме идей ([4](#src-upvote-api)) | — | — | Письмо в поддержку — шаг для Вани |
| **Неофициальный API** (`yzapi.yazio.com`) | Да: `POST /v22/user/recipes` ([5](#src-recipes)) | Да: `GET /v22/user/recipes` — список id, `GET /v22/recipes/{id}`, правка `PUT`, удаление `DELETE` ([5](#src-recipes), [6](#src-recipe-id)) | Да: `GET /v22/products/search`, в ответе `is_verified`, `producer`, нутриенты ([7](#src-search), [8](#src-search-result)) | Да: `POST /v22/user/consumed-items` — продукты в граммах и порции рецептов ([9](#src-consumed), [10](#src-recipe-portion)) | Почта + пароль Yazio → токен (`grant_type=password`), id и секрет приложения Yazio ([11](#src-oauth)) | Только через наш воркер: из браузера мешают CORS ([12](#src-saganos)) и проверка `User-Agent` ([3](#src-spec)) | Условия Yazio, блокировка аккаунта, поломка при обновлении | Средняя–большая (§4) |
| **Ссылки `yazio://`, universal links** | Не найдено | — | — | — | — | Ссылку открыть можно | Документации нет | — |
| **Команды iOS (Shortcuts)** | Не найдено | — | — | Были «любимые продукты» как команды Siri ([13](#src-siri)); в отзывах — «команды ничего не делают» ([14](#src-appstore)) | — | PWA не вызывает Команды с данными сама (не проверено) | — | — |
| **Apple Health / Health Connect** | Нет | — | — | Нет: Yazio пишет питание в Health, а читает оттуда шаги, тренировки, вес, давление, сахар, цикл ([15](#src-privacy)) | — | PWA к HealthKit доступа не имеет | — | — |
| **Импорт рецепта по ссылке** | Противоречиво: одна статья конкурента — есть в PRO, по разметке schema.org Recipe ([16](#src-nutrola-import)), другие его же статьи — нет ([17](#src-nutrola-noimport), [18](#src-nutrola-pro)) | Нет | — | — | — | Можно отдать страницу с разметкой (не проверено) | Не подтверждено Yazio | Небольшая, если функция есть |
| **Свой продукт** (КБЖУ на 100 г готового) | — | — | — | Да, тем же неофициальным API: `POST /v22/user/products` ([19](#src-products)) | Как неофициальный API | Через воркер | Те же + у нас нет КБЖУ (бэклог P2) | Последний вариант |
| **Как сейчас: «Копировать»** | Вручную | — | — | Вручную | — | Да | Нет | 0 |

## 3. API Yazio подробно

Официального описания нет. Ниже — что видно по сторонним описаниям и клиентам. Все они пишут, что неофициальные и не связаны с Yazio ([3](#src-spec), [20](#src-goyazio), [21](#src-mcp)).

**Живые источники:**

| Источник | Что | Активность |
|---|---|---|
| [yazio-community/yazio-api-specification](https://github.com/yazio-community/yazio-api-specification) | OpenAPI 3.0, API **v22**, собрано из трафика через mitmproxy, дальше правится руками; есть рецепты, свои продукты, избранное | Последние коммиты — 5–6 августа 2026 |
| [saganos/yazio_public_api](https://github.com/saganos/yazio_public_api) | swagger, **v15**: вход, профиль, поиск, дневник; рецептов нет | Июнь 2026 |
| [juriadams/yazio](https://github.com/juriadams/yazio) | Клиент на TypeScript, v15; рецепты — в открытом PR #6 (v20) | Код — апрель 2024, PR — март 2026, не влит |
| [go-yazio](https://github.com/dumpsabfuck/go-yazio) | Клиент на Go: вход, свой продукт, запись в дневник | Версия 1.2.0 от 27.08.2026 ([22](#src-goyazio-pkg)) |
| [fliptheweb/yazio-mcp](https://github.com/fliptheweb/yazio-mcp) | MCP-сервер поверх juriadams/yazio: поиск, дневник; рецептов нет | — |

**Вход** (подтверждено [11](#src-oauth), [3](#src-spec)):
- `POST /v22/oauth/token`, форма `application/x-www-form-urlencoded`: `grant_type=password` + почта и пароль, либо `grant_type=refresh_token`.
- `client_id` и `client_secret` — одни на все установки приложения Yazio, зашиты в приложение и в сторонние клиенты. Своих выдать некому. Значения в отчёт не переносим.
- Входа через «авторизацию у Yazio с редиректом» (OAuth code flow) нет. Значит, пароль от Yazio нужен хотя бы один раз.
- Аккаунт Yazio через «Войти с Apple» или Google, скорее всего, пароля не имеет, и `grant_type=password` для него не сработает (не проверено).
- Сколько живут токены, не нашли (не проверено).
- Любой запрос, кроме получения токена, с незнакомой версией приложения в `User-Agent` получает `403 {"error":"version_blocked"}` ([3](#src-spec)). Придётся подставлять строку настоящего приложения и обновлять её, когда старую версию заблокируют.

**Поиск продуктов** — `GET /v22/products/search` ([7](#src-search), [8](#src-search-result)):
- Параметры: `query` (текст или штрихкод), `sex` и `countries` (без них — 400), `locales` (необязательный).
- Порядок результатов зависит от `Accept-Language`.
- В ответе — массив: `product_id`, `name`, `producer`, `is_verified`, `score`, `amount`, `serving`, `serving_quantity`, `base_unit`, нутриенты, `countries`, `language`.
- **Признак проверенного продукта есть — `is_verified`.** Что это именно синяя галочка в приложении — вывод, не проверено.
- Фильтра «только проверенные» нет, сортируем сами: сначала `is_verified`, потом `score`.
- Нутриенты указаны на единицу `base_unit` (на грамм), а не на 100 г ([3](#src-spec)).
- Что найдётся по «Гречка», «Курица бедро» с `locales=ru_RU`, не проверено: для России ли база Yazio и в какой стране ваши аккаунты, не знаем. Русский в приложении есть ([14](#src-appstore)).

**Рецепты** ([5](#src-recipes), [6](#src-recipe-id), [23](#src-recipe-draft), [24](#src-recipe)):
- `POST /v22/user/recipes` — создать. `GET /v22/user/recipes` — список id своих рецептов (только строки, без названий). `PUT /v22/user/recipes/{id}` — изменить. `DELETE /v22/user/recipes/{id}` — удалить. Прочитать — `GET /v22/recipes/{id}` («публичный рецепт», тот же путь, что для рецептов Yazio).
- Тело (`RecipeDraft`): `id`, `name`, `portion_count` (целое), `servings[]` — ингредиенты (`product_id`, `amount`, `serving`, `serving_quantity`, `name`, `producer`, `base_unit`), `instructions[]`, `nutrients`.
- Ограничения: **минимум 2 ингредиента**; `portion_count` — целое и без дробной части в JSON: `2.0` даёт 500 ([3](#src-spec)). То же правило «от двух продуктов» — в приложении ([25](#src-giga)).
- **id рецепта, судя по `id` в теле, задаёт клиент** — как у записей дневника, где это UUID, который присылает клиент ([26](#src-consumed-ts)). Тогда id мы знаем до создания и повторный `POST` с тем же id не плодит дубль (не проверено). Наш `newId()` (nanoid) — не UUID; UUID сгенерирует воркер.
- `nutrients` в теле: считает ли сервер КБЖУ рецепта сам или берёт присланные, не ясно (не проверено). Если берёт присланные, нам понадобится расчёт по нутриентам продуктов — новая доменная логика.
- **Обновить рецепт можно (`PUT`)**, дубли не нужны. Но меняются ли от этого прошлые записи дневника с этим рецептом — неизвестно (не проверено). Для нас это главный вопрос, см. §4.
- Нужен ли PRO для своих рецептов — противоречиво: GIGA (2023) — есть и бесплатно ([25](#src-giga)), статья конкурента (2026) — только в PRO ([18](#src-nutrola-pro)). Не проверено.
- Видно ли рецепт на другом устройстве — да, если войти тем же аккаунтом: рецепты хранятся на сервере (вывод из API).
- Поделиться с Ксюшей: в API есть «друзья» (`/v22/user/buddies`), но о передаче рецептов там ничего нет; в saganos прямо сказано, что «поделиться сохранённым блюдом» не описано ([12](#src-saganos)). Сработает ли у Ксюши `recipe_id` из аккаунта Вани — не проверено. Пока считаем, что **у каждого свой рецепт в своём аккаунте**.

**Дневник** — `POST /v22/user/consumed-items` ([9](#src-consumed), [27](#src-consumed-items), [10](#src-recipe-portion)):
- Тело: `{ products: [], recipe_portions: [], simple_products: [] }`.
- Продукт: `id` (UUID от клиента), `product_id`, `date` (полная местная метка времени), `daytime` (`breakfast` / `lunch` / `dinner` / `snack`), `amount` в граммах, `serving`, `serving_quantity`.
- Порция рецепта: `id`, `date`, `daytime`, `recipe_id`, `portion_count` — **число, дробное допустимо** по схеме (не проверено на сервере).
- Удалить запись — `DELETE` с JSON-телом.
- Граммы готового для рецепта в API не видны. В приложении порцию рецепта можно указать в граммах ([25](#src-giga)), как это уходит в API, не проверено. Мы будем передавать долю: `portion_count = доля порции × portion_count рецепта`.
- `simple_products` — судя по названию, быстрая запись калорий без продукта. Схема пустая, не проверено.

## 4. Схема интеграции (если всё же делаем)

### Шаг 1. Порция продуктами по сырому весу

Это то же, что текст «Копировать»: `rawAmountsCopyText` — «Гречка (сырой вес) — 89 г» по каждому учитываемому ингредиенту. Сырые граммы порции уже считает домен. Перенос точный при любом сыром весе в этот раз: рецепт не нужен, дублей и версий рецепта нет.

1. В редакторе блюда у ингредиента — «Продукт в Yazio»: экран поиска (UX §3а). Сначала проверенные, потом остальные (`is_verified`, затем `score`). Показываем название, производителя, ккал на 100 г, галочку.
2. Выбор запоминаем у ингредиента. Проверенный продукт с совпадающим названием можно выбрать сам, но только с подтверждением. Непроверенный сами не берём — спрашиваем.
3. В калькуляторе у порции — «В Yazio»: приём пищи (`Select`), дата — сегодня. Воркер пишет в дневник по записи `products` на каждый ингредиент с `amount = сырые граммы порции`.

### Шаг 2. Рецепт (одна строка в дневнике)

Порция рецепта = доля одного рецепта. А сырые граммы у нас меняются от варки к варке (в блюде хранится последний ввод). Отсюда правило:

- **Создаём рецепт**, когда переносим блюдо впервые: `POST`, `servings` — сырые граммы этой варки, `portion_count = 1` (рецепт = всё блюдо), id (UUID) задаём сами и запоминаем.
- **Берём готовый**, если состав (продукты Yazio и сырые граммы) совпадает с запомненным: в дневник уходит `recipe_portions` с `portion_count = доля порции`.
- **Состав поменялся.** Если правка рецепта (`PUT`) не трогает прошлые дни, делаем `PUT`. Если трогает, то либо новая версия рецепта (новый id, старый не трогаем — лишние рецепты в списке «Созданные»), либо шаг 1 для этой варки. Решаем после [проверки руками](#5-проверить-руками).
- Рецепт удалили в Yazio (404 на `GET /v22/recipes/{id}`) — создаём заново.
- Меньше двух учитываемых ингредиентов (простое блюдо) — рецепта нет, только шаг 1.

### Что храним и где

| Что | Где | Почему |
|---|---|---|
| Продукт Yazio у ингредиента: `yazio: { productId, name, producer, verified } \| null` | `Ingredient` в блюде, синхронизируется с группой | `product_id` общий для всех аккаунтов, Ксюше не надо искать заново. Новое поле → `CURRENT_VERSION` 12 → 13, миграция `yazio: null`, тест на фикстуре v12, `migrateChange` для записей `dish` v12 (ARCHITECTURE §5.3, §10). Справочник «название → продукт» на группу удобнее для одинаковых продуктов в разных блюдах, но это новый тип записи; начать с поля у ингредиента |
| Рецепт Yazio: `recipeId` и отпечаток состава (продукты + граммы), по которому видно, что рецепт устарел | **У пользователя, не в группе**: таблица D1 `yazio_recipe (user_id, dish_id, recipe_id, fingerprint)` | Рецепт живёт в аккаунте Yazio конкретного человека, у Вани и Ксюши id разные. В записи группы `dish` ему не место |
| Токены Yazio (access + refresh) | D1 `yazio_link (user_id, …)`, зашифровано ключом из `wrangler secret` | Пароль вводится один раз на экране «Yazio» и уходит в воркер для обмена на токены. Не храним ни у нас, ни в браузере |

Производное (доли, граммы порции, КБЖУ) не храним, как и сейчас.

### Браузер или воркер

- **Только воркер** (`worker/yazio.ts`, маршруты `/api/yazio/*`). Из браузера — CORS ([12](#src-saganos)), `User-Agent` заголовок в fetch задать нельзя, а `client_secret` в бандл PWA класть нельзя. Секрет и строка версии — `wrangler secret` (CLAUDE.md).
- Воркер ходит в Yazio только от имени вошедшего пользователя. **Без аккаунта в нашем приложении интеграции нет** — иначе получится открытый прокси.
- Домен воркер не импортирует (ARCHITECTURE §9): граммы порции считает клиент (`src/domain`) и присылает готовыми.
- Тип ответа Yazio проверяем схемой в воркере: поломку видно сразу, а не мусором в дневнике.
- Пропускает ли Yazio запросы с адресов Cloudflare — не проверено.

### Когда сломается

- Всё, что связано с Yazio, — отдельная кнопка. Блюда, расчёт и «Копировать» от неё не зависят.
- Ответ 401 / 403 / `version_blocked` или ответ не той формы → тост «Yazio сейчас недоступен — скопируйте текст» и сразу «Копировать».
- Чинить придётся воркер: новый путь `/vNN/`, строку `User-Agent` или поля. Сохранённые `productId` и `recipeId`, скорее всего, переживут смену версии API (не проверено).
- Если Yazio заблокирует аккаунт, теряется дневник. Поэтому сначала пробовать на отдельном аккаунте Yazio.

## 5. Проверить руками

Ваня, с аккаунтом Yazio и iPhone. Пароли и токены в чат не присылать.

1. **Условия использования.** Открыть [Terms of Use & Privacy Policy](https://help.yazio.com/hc/en-us/articles/203444951-Terms-of-Use-Privacy-Policy) (у меня — 403). Найти пункты про reverse engineering, автоматический доступ, сторонние программы и блокировку аккаунта. Записать номера пунктов.
2. **Как вы входите в Yazio.** Профиль → аккаунт: почта с паролем или Apple / Google? Если не почта — есть ли в настройках «задать пароль»?
3. **PRO и рецепты.** Без PRO (или у Ксюши, если у неё нет): «+» у приёма пищи → «⋯» → «Новый рецепт». Даёт ли создать и сохранить рецепт из двух продуктов? Есть ли PRO у вас обоих?
4. **Правка рецепта задним числом (главное).**
   1. Создать рецепт «Тест» из гречки 100 г и курицы 100 г, 1 порция.
   2. Записать его во вчерашний день, запомнить ккал.
   3. Изменить рецепт: гречка 200 г.
   4. Посмотреть, поменялись ли ккал вчерашней записи.
5. **Порция рецепта.** Записать рецепт в дневник: какие единицы можно выбрать (порции, граммы)? Можно ли 0,37 порции?
6. **Синяя галочка.** Поиск «Гречка», «Курица бедро», «Рис басмати»: сколько результатов с галочкой в первой десятке, есть ли русские названия. Страна и язык в профиле Yazio?
7. **Импорт по ссылке.** Есть ли в создании рецепта «импорт» или «по ссылке»? Если есть — попробовать любую страницу рецепта с разметкой schema.org.
8. **Поделиться.** Есть ли у своего рецепта «Поделиться»? Что приходит Ксюше, открывается ли у неё рецепт в Yazio, может ли она записать его в свой дневник?
9. **Команды iOS.** Приложение «Команды» → «+» → поиск «Yazio»: какие действия есть, принимают ли они параметры (продукт, граммы)?
10. **Ссылки.** Если «Поделиться» даёт ссылку — какой у неё вид (`yazio.com/redirect/…` или другой)? Ссылки этого вида открывают приложение ([28](#src-aasa)).
11. **Поддержка Yazio.** Написать в [help.yazio.com](https://help.yazio.com/): есть ли API или партнёрский доступ для личного приложения (создать рецепт, записать порцию в дневник); можно ли пользоваться API приложения от своего аккаунта. Ответ — в #49.

## 6. Что дальше

Issues не заводим, пока нет решения. Если решение «делаем»:

1. **docs: этап «Yazio» в roadmap** — по итогам «Проверить руками»: вариант рецепта (`PUT` или новая версия), PRO, тексты UX.
2. **feat: воркер — связка с Yazio** — `/api/yazio/link` (пароль → токены, шифрование, `wrangler secret`), `/api/yazio/unlink`, обновление токена, миграция D1 `yazio_link`.
3. **feat: поиск продукта Yazio у ингредиента** — `/api/yazio/search`, экран поиска (сначала проверенные), поле `Ingredient.yazio`, схема v13 + миграция + `migrateChange` + тесты.
4. **feat: порция в дневник Yazio продуктами** — граммы из домена, выбор приёма пищи, `/api/yazio/diary`, тост и «Копировать» при ошибке.
5. **feat: рецепт Yazio у блюда** — `yazio_recipe` в D1, отпечаток состава (чистая функция с тестами), создание / повторное использование / новая версия, `recipe_portions`.
6. **chore: проверка схемы ответов Yazio** — схема ответов в воркере и тест на сохранённых примерах ответов из описаний API.

### Заметка про FatSecret

FatSecret (часть 2) — одно наблюдение. В отличие от Yazio, у FatSecret есть официальный Platform API: вход от имени пользователя по OAuth, `food_entry.create` (запись в дневник) и сохранённые блюда, которые копируются в дневник ([29](#src-fatsecret)). Подробно — во второй части.

## 7. Источники

1. <a id="src-apis"></a>[apis.io — YAZIO](https://apis.io/providers/yazio/) — нет программы для разработчиков, `yzapi.yazio.com` без токена отвечает 401 (оценка от 04.10.2026).
2. <a id="src-partner"></a>[yazio.com — Become a partner](https://www.yazio.com/en/become-a-partner) — только партнёры-сайты и блогеры, про API ни слова.
3. <a id="src-spec"></a>[yazio-community/yazio-api-specification — README](https://github.com/yazio-community/yazio-api-specification) — v22; неофициально; проверка `User-Agent` → `version_blocked`; нутриенты на единицу; рецепт ≥ 2 ингредиентов и целый `portion_count`; учётные данные приложения общие.
4. <a id="src-upvote-api"></a>[Yazio feature upvote — Expose public API](https://yazioen.featureupvote.com/suggestions/28294/expose-public-api) — просьба пользователей открыть API (страница отдаёт 403, видно только в поиске).
5. <a id="src-recipes"></a>[spec/paths/v22/user/recipes.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/paths/v22/user/recipes.yaml) — `POST` (создать, тело `RecipeDraft`), `GET` (список id).
6. <a id="src-recipe-id"></a>[spec/paths/v22/user/recipes/{id}.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/paths/v22/user/recipes/%7Bid%7D.yaml) — `PUT` (изменить), `DELETE` (удалить).
7. <a id="src-search"></a>[spec/paths/v22/products/search.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/paths/v22/products/search.yaml) — параметры поиска, `sex` и `countries` обязательны, порядок по `Accept-Language`.
8. <a id="src-search-result"></a>[spec/components/schemas/ProductSearchResult.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/components/schemas/ProductSearchResult.yaml) — поля результата, включая `is_verified`.
9. <a id="src-consumed"></a>[spec/paths/v22/user/consumed-items.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/paths/v22/user/consumed-items.yaml) — чтение, запись и удаление записей дневника.
10. <a id="src-recipe-portion"></a>[spec/components/schemas/ConsumedRecipePortion.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/components/schemas/ConsumedRecipePortion.yaml) — `recipe_id`, `portion_count` (number), `daytime`, `date`.
11. <a id="src-oauth"></a>[spec/components/schemas/OAuthTokenRequest.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/components/schemas/OAuthTokenRequest.yaml) — `grant_type` `password` / `refresh_token`, `client_id` одинаковый у всех установок.
12. <a id="src-saganos"></a>[saganos/yazio_public_api](https://github.com/saganos/yazio_public_api) — v15; из браузера запросы упираются в CORS; «поделиться сохранённым блюдом» не описано.
13. <a id="src-siri"></a>[antwort.net — Yazio и Apple Health](https://www.antwort.net/a/technologie/wie-kann-ich-die-yazio-app-mit-apple-health-verbinden.html), по выдаче поиска — любимые продукты как команды Siri (вторичный источник).
14. <a id="src-appstore"></a>[App Store — Yazio](https://apps.apple.com/us/app/yazio-calorie-counter-diet/id946099227) — Apple Health, виджеты, русский язык; отзыв о неработающих командах Siri.
15. <a id="src-privacy"></a>[yazio.com — Privacy Policy](https://www.yazio.com/en/privacy) (версия апреля 2026) — что Yazio читает из Apple Health и что пишет в него; Health Connect, Samsung Health, Fitbit, Garmin.
16. <a id="src-nutrola-import"></a>[Nutrola — Can YAZIO import recipes from URLs](https://nutrola.app/en/blog/can-yazio-import-recipes-from-urls) (05.04.2026) — утверждает, что импорт по ссылке есть в PRO. Блог конкурента, ненадёжно.
17. <a id="src-nutrola-noimport"></a>[Nutrola — Why Yazio cannot import recipes from URLs](https://nutrola.app/en/blog/why-does-yazio-not-have-recipe-import-from-urls) — утверждает обратное.
18. <a id="src-nutrola-pro"></a>[Nutrola — Yazio Free vs PRO](https://nutrola.app/en/blog/yazio-free-vs-pro-what-do-you-actually-get) — свои рецепты только в PRO, импорта нет.
19. <a id="src-products"></a>[spec/paths/v22/user/products.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/paths/v22/user/products.yaml) — создание своего продукта (`UserProductDraft`: название, нутриенты, `is_private`).
20. <a id="src-goyazio"></a>[go-yazio](https://github.com/dumpsabfuck/go-yazio) — «приватный API, ломается в любой момент», «reverse engineering может нарушать условия».
21. <a id="src-mcp"></a>[fliptheweb/yazio-mcp](https://github.com/fliptheweb/yazio-mcp) — вход почтой и паролем, рецептов нет, «Yazio не даёт официального API».
22. <a id="src-goyazio-pkg"></a>[pkg.go.dev — go-yazio](https://pkg.go.dev/github.com/controlado/go-yazio/pkg/yazio) — v1.2.0 от 27.08.2026: вход, запись в дневник, свой продукт.
23. <a id="src-recipe-draft"></a>[spec/components/schemas/RecipeDraft.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/components/schemas/RecipeDraft.yaml) — поля тела рецепта, `servings` ≥ 2.
24. <a id="src-recipe"></a>[spec/components/schemas/Recipe.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/components/schemas/Recipe.yaml) — рецепт при чтении, флаги `is_yazio_recipe`, `is_pro_recipe`.
25. <a id="src-giga"></a>[GIGA — Yazio: eigene Rezepte erstellen](https://www.giga.de/tipp/yazio-eigene-rezepte-erstellen/) (16.10.2023) — как создать рецепт в приложении, ≥ 2 продуктов, бесплатно, порция по людям или в граммах.
26. <a id="src-consumed-ts"></a>[juriadams/yazio — src/api/user/consumed.ts](https://github.com/juriadams/yazio/blob/main/src/api/user/consumed.ts) — `id` записи дневника — UUID от клиента.
27. <a id="src-consumed-items"></a>[spec/components/schemas/ConsumedItems.yaml](https://github.com/yazio-community/yazio-api-specification/blob/main/spec/components/schemas/ConsumedItems.yaml) — поля записи продукта в дневнике.
28. <a id="src-aasa"></a>[yazio.com/.well-known/apple-app-site-association](https://www.yazio.com/.well-known/apple-app-site-association) — приложение открывает только ссылки `/redirect/*`.
29. <a id="src-fatsecret"></a>[FatSecret Platform API — Authentication](https://platform.fatsecret.com/docs/guides/authentication) — официальный API, OAuth от имени пользователя.
