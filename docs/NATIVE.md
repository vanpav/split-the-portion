# Приложение в App Store и Google Play (Capacitor)

Статус: план, ждёт решений по §9 · 2026-10-07. Пока план не согласован, этапов в `roadmap/` нет; после — §8 разбивается на файлы `roadmap/21-*.md` … `25-*.md`.

## 1. Цель и границы

- Тот же React-код, что и у PWA, в нативной оболочке Capacitor для iOS и Android. Один `src/`, одна сборка Vite, разница — в слое `src/platform` (§3).
- PWA остаётся и живёт дальше: веб — основной канал, магазины — второй.
- Домен (`src/domain`), стор, IndexedDB, протокол синхронизации не меняются. Меняются: адрес API и вход (§4), роутинг (§5), обновления (§7); добавляются пуши (§6).
- Не делаем: нативные экраны, виджеты, покупки внутри приложения, вход через Apple/Google.

## 2. Ключевое решение: бандл внутри приложения, API на чужом адресе

Два способа завернуть сайт в Capacitor:

| | **A. Бандл внутри (рекомендую)** | B. `server.url` на рабочий адрес |
|---|---|---|
| Открывается без сети | да, сразу | только из кеша Service Worker, на iOS ненадёжно |
| Ревью Apple (4.2, 2.5.2) | обычное приложение | «сайт в рамке» — частая причина отказа |
| Cookie сессии | чужой origin → нужна смена входа (§4) | тот же origin, ничего не меняем |
| Обновления | OTA (§7) | мгновенно, как сайт |

Выбираем **A**. Страница открывается с `capacitor://localhost` (iOS) и `https://localhost` (Android), API — `https://<рабочий адрес>/api/*`. Отсюда всё остальное: CORS, вход по токену, отключённый Service Worker, свой механизм обновлений.

## 3. Архитектура клиента

```
src/
  platform/
    index.ts          isNative, platform: 'web' | 'ios' | 'android'; выбор реализации при старте
    api.ts            apiUrl(path): '' + path на вебе, VITE_API_ORIGIN + path в приложении
    authToken.ts      хранение bearer-токена: на вебе нет (cookie), в приложении — Keychain/Keystore
    files.ts          «Сохранить копию» (DataSection): <a download> / Filesystem + Share
    clipboard.ts      CopyButton, «Вставить»: navigator.clipboard / @capacitor/clipboard
    haptics.ts        HoldButton: navigator.vibrate / @capacitor/haptics (на iOS vibrate нет вовсе)
    updates.ts        UpdatePrompt: Service Worker / OTA (§7) — один интерфейс «есть новая версия», «обновить»
    push.ts           только приложение (§6)
    deepLinks.ts      appUrlOpen → router.navigate (§5)
    backButton.ts     системная «назад» Android → useBack (§5)
```

- Компоненты зовут `@/platform/*`, а не `navigator.*` и не `@capacitor/*` напрямую. Правило — в CLAUDE.md («Код»), проверка — oxlint `no-restricted-imports` для `@capacitor/*` вне `src/platform`.
- Нативные модули грузятся через `import()` только при `isNative`, чтобы веб-бандл не рос.
- Сборка: `pnpm build` — веб как сейчас; `pnpm build:native` = `vite build --mode native` (без `VitePWA`, с `VITE_API_ORIGIN`) + `cap sync`. Папки `ios/` и `android/` — в git.
- Версия: `__APP_VERSION__` (scripts/appVersion.ts) = версия веб-бандла; у оболочки своя `nativeVersion` (CFBundleShortVersionString / versionName). Обе уходят на сервер заголовком `X-App-Version` (§7).
- Безопасные зоны: `viewport-fit=cover` и `env(safe-area-inset-*)` уже нужны PWA; проверить шапки и нижние кнопки под «чёлкой» и жестовой полосой Android. `@capacitor/status-bar` — цвет под тему, `@capacitor/splash-screen` — цвет «frosted-ground», прятать после первой отрисовки.
- Клавиатура: `@capacitor/keyboard`, `resize: 'native'` на iOS — поля `NumberField` не должны уезжать под клавиатуру.

## 4. Сервер и вход

**Проблема.** Cookie `SameSite=Lax` с рабочего адреса не уходит из `capacitor://localhost`; в WKWebView сторонние cookie режет ITP. Варианты:

1. **Bearer-токен Better Auth (рекомендую).** Плагин `bearer()` на сервере; клиент берёт токен из заголовка `set-auth-token`, кладёт в Keychain/Keystore (`@capacitor/preferences` не подходит — не шифрует; нужен плагин secure storage, §9) и шлёт `Authorization: Bearer`. Веб остаётся на cookie, код тот же — `authClient` получает `fetchOptions.auth` только в приложении.
2. `CapacitorHttp` + `CapacitorCookies`: подменяет `fetch` нативным, cookie живут в нативной банке. Меньше кода, но ломает загрузку аватара (`FormData`/бинарь), а поведение банки cookie на iOS непредсказуемо. Не берём.

**Изменения в `worker/`:**
- CORS для `/api/*` только с `capacitor://localhost` и `https://localhost`, `Authorization` в разрешённых заголовках. `csrf()` Hono — тот же список.
- Better Auth: `trustedOrigins` += эти два адреса; `bearer()`; сессия по токену — те же 60 дней.
- Экземпляр Better Auth выбирается по origin запроса (`worker/index.ts`) — для приложения origin чужой, ключом становится адрес воркера, а не `Origin`.
- Минимальная версия: `X-App-Version` ниже `MIN_APP_VERSION` → `426 upgrade_required`, в UI свой текст (UX §6, «одна причина — один текст»).

**Passkey** — обязателен с первого релиза, отдельный раздел §4а.

**Требования магазинов к аккаунту:** удаление аккаунта внутри приложения обязательно (App Store 5.1.1(v), Google Play «Account deletion» + веб-страница удаления). Сейчас его нет — отдельная задача: `deleteUser` Better Auth, что делать с группами, где пользователь владелец, и с его записями.

## 4а. Passkey в приложении

Требование: тот же passkey, что человек уже сделал на сайте (iCloud Keychain, Google Password Manager, менеджер паролей), входит в приложение, и наоборот. Для этого rpID приложения и сайта должен быть один, а приложение должно быть «своим» для этого домена.

### Почему не работает «из коробки»

1. **WebView.** `navigator.credentials` в WKWebView и Android WebView со страницы `capacitor://localhost` / `https://localhost` не может попросить passkey для чужого rpID. Нужен нативный вызов: `ASAuthorizationPlatformPublicKeyCredentialProvider` на iOS, Credential Manager на Android.
2. **Challenge в cookie.** Better Auth кладёт challenge в подписанную cookie `better-auth-passkey` (ответ `generate-*-options`) и читает её в `verify-*`. Из `capacitor://localhost` это сторонняя cookie: WKWebView её режет, плагин `bearer()` её не переносит — он только про сессию. Без неё `verify` отвечает «challenge не найден».
3. **Origin на Android.** В `clientDataJSON` у нативного passkey Android пишет не `https://<домен>`, а `android:apk-key-hash:<base64url(sha256 сертификата подписи)>`. Сервер сейчас ждёт один origin. На iOS (17.4+) в `clientDataJSON` попадает `https://<домен>` — совпадает с сайтом.

### Решение

**Клиент — `@capgo/capacitor-passkey`** (MPL-2.0, версия следует за Capacitor, 8.x поддерживается).
- `autoShimWebAuthn()` при старте приложения подменяет `navigator.credentials.create/get` нативными вызовами. `passkeyClient()` Better Auth (внутри `@simplewebauthn/browser`) работает без изменений — `SignInForm`, «Добавить passkey» в «Аккаунте» не трогаем.
- Вызов — в `src/platform/passkey.ts`, только при `isNative`; на вебе плагин не грузим.
- В `capacitor.config.ts`: `plugins.CapacitorPasskey.origin = 'https://<домен>'`; `cap sync` сам прописывает Associated Domains (iOS) и ссылку на assetlinks (Android).
- Автоподстановки passkey в поле почты (conditional UI) у нас нет — только кнопка «Войти с passkey», поэтому ограничения плагина на autofill нас не касаются.
- Альтернативы: `Argo-Navis-Dev/capacitor-passkey-plugin` (свой API, пришлось бы обходить `passkeyClient` и звать `/passkey/*` руками), платный плагин Capawesome. Свой нативный плагин не пишем.

**Сервер — три изменения.**
1. *Challenge через заголовок* (`worker/nativeChallenge.ts`, Hono-middleware перед `/auth/*`, только для origin приложения):
   - в ответе на `/passkey/generate-*-options` берём `Set-Cookie` с именем `…better-auth-passkey` и кладём его `имя=значение` в заголовок `X-Passkey-Challenge` (в `exposeHeaders` CORS);
   - в запросе на `/passkey/verify-*` значение `X-Passkey-Challenge` дописываем в `Cookie` перед тем, как отдать запрос Better Auth.
   
   Клиент держит значение в памяти между двумя запросами одной попытки: `fetchOptions.onResponse` / `onRequest` в `authClient` только в приложении. Подпись cookie и срок (5 минут) проверяет сам Better Auth — мы только переносим строку. ~30 строк и тест в `worker/__tests__`. Это рукописная часть — нужно согласие (§9).
   
   Почему не иначе: `CapacitorHttp` с нативной банкой cookie для `/passkey/*` обошёлся бы без серверного кода, но нативный запрос не шлёт `Origin`, Better Auth на это отвечает 403, и банка cookie на iOS ведёт себя непредсказуемо. Ждать в Better Auth хранения challenge не в cookie — не на что опереться.
2. *Origin:* `passkey({ origin: [webOrigin, ...ANDROID_APK_ORIGINS] })` — `origin` у плагина принимает массив. `ANDROID_APK_ORIGINS` — переменная воркера: хеш ключа Play App Signing (из Play Console) и хеш ключа отладочных/внутренних сборок. rpID не меняется — hostname рабочего адреса.
3. *Файлы ассоциации* — маршруты воркера (`run_worker_first` += `/.well-known/*`), чтобы отдать `content-type: application/json` без расширения файла:
   - `/.well-known/apple-app-site-association`: `webcredentials.apps: ["<TEAMID>.<bundleId>"]` и `applinks` (§5);
   - `/.well-known/assetlinks.json`: `delegate_permission/common.handle_all_urls` и `common.get_login_creds` для пакета и обоих SHA-256 отпечатков.

Имя ключа по AAGUID (after-хук в `worker/auth.ts`) продолжает работать: нативные passkey приходят с теми же AAGUID iCloud Keychain / Google Password Manager.

### Домен — решить до релиза

rpID = hostname. Сейчас это адрес `*.workers.dev`. Работать будет (`workers.dev` в Public Suffix List, AASA можно отдать и там), но:
- смена домена потом = все passkey и в приложении, и на сайте перестают подходить (CLOUDFLARE §12);
- домен прописывается в entitlements сборки в магазине — смена требует нового релиза оболочки.

Поэтому свой домен (CLOUDFLARE §12) — первая задача этапа 23, до того как passkey начнут делать массово.

### Окружения

- Нативный passkey работает только с доменом из AASA/assetlinks и Associated Domains сборки. Превью веток (`<ветка>-split-the-portion….workers.dev`) — без passkey в приложении (вход паролем); на вебе превью работают как сейчас.
- Для разработки — постоянный адрес стейджинга (алиас превью или поддомен `staging.<домен>`) со своими AASA/assetlinks, отдельная схема сборки `Staging` в Xcode и flavor в Gradle. Associated Domains с `?mode=developer` — чтобы iOS не ждал CDN Apple при отладке.
- Минимальные версии: iOS 16 (нативные passkey), Android 9 / API 28 (Credential Manager через Play Services).

### Проверка

- `worker/__tests__`: перенос challenge — заголовок → cookie, cookie → заголовок, чужой origin не трогается, другие пути не трогаются.
- Руками на устройствах (iPhone с iCloud Keychain, Android с Google Password Manager):
  1. passkey, созданный на сайте, входит в приложение;
  2. passkey, созданный в приложении, входит на сайте и на втором устройстве;
  3. отмена системного окна → текст «passkey не выбран» (`authErrors.ts`), а не общий;
  4. удаление passkey в «Аккаунте» в приложении.

## 5. Роутинг

**Сейчас:** `createHashRouter`, ссылки-приглашения `https://<адрес>/#/join/<код>`, сброс пароля `/?token=…#/account/reset`.

**Проблема.** Universal Links (iOS) и App Links (Android) сопоставляют путь, а не `#…`. Ссылка-приглашение с хешем откроется в Safari, а не в приложении. Внутри Capacitor хеш работает, но нам нужна общая адресация «сайт ↔ приложение».

**Решение: переехать на `createBrowserRouter` везде — и в вебе, и в приложении.**
- Адреса те же без `#`: `/d/:id`, `/join/:code`, `/account/reset?token=…`. `paths.ts` уже отдаёт пути без хеша — меняются места, где склеивают `/#` (`InviteCard`, письмо сброса в `worker/auth.ts`).
- Воркер: `assets.not_found_handling: "single-page-application"` — любой путь вне `/api/*` отдаёт `index.html`. `navigateFallback` в Workbox уже стоит.
- Совместимость: при старте, если в `location.hash` есть `#/…`, — `router.navigate(hashPath, { replace: true })`. Старые приглашения, закладки и установленные PWA продолжают работать. Убрать через пару месяцев.
- В приложении Capacitor отдаёт `index.html` на любой путь сам.
- Тест: старый хеш-адрес → новый путь (чистая функция в `src/app`, тест в `src/app/__tests__`).

**Глубокие ссылки в приложении** (`src/platform/deepLinks.ts`): `App.addListener('appUrlOpen')` → берём `pathname + search` → `router.navigate`. Разрешённые пути — белый список (`/join/:code`, `/account/reset`, `/d/:id` из пуша). AASA и assetlinks — `applinks` на `/join/*` и `/account/reset`.

**Назад:**
- Android: `App.addListener('backButton')` → тот же путь, что «←» (`useBack`): закрыть меню / `AlertDialog` / `Select`, иначе шаг назад; на корне — `App.minimizeApp()` (не `exitApp`, чтобы не терять состояние).
- iOS: системного жеста «назад» в WKWebView нет, а `allowsBackForwardNavigationGestures` конфликтует с `ScreenTransition`. Свайп от левого края — через `@use-gesture/react` (уже есть) в `OverScreen`/`ScreenTransition`, вызывает `useBack`. Отдельная задача, не блокирует релиз.

## 6. Пуши

**Зачем.** Пользы «на всякий случай» нет — Apple и пользователи этого не любят. Поводы, которые относятся к делу:

| Событие | Кому | Текст (черновик, через `ru-ui-copy`) | Тап ведёт |
|---|---|---|---|
| В группу вступил человек по приглашению | владелец | «Ксюша теперь в группе „Дом“» | `/settings/group/<id>` |
| Кто-то в группе добавил блюдо | остальные (вкл. в настройках, по умолчанию выкл.) | «Ваня добавил „Плов“» | `/d/<id>` |
| (позже) Порции разобрали / осталось N г | компания блюда | — | `/d/<id>` |

Свежесть данных пушами не держим: тихие пуши iOS режет. Вместо этого — синхронизация на `App` `resume` (как сейчас на `visibilitychange`, проверить, что срабатывает в WKWebView).

**Канал.** FCM для обеих платформ (APNs-ключ загружается в Firebase). Клиент — `@capacitor-firebase/messaging`: отдаёт FCM-токен и на iOS. `@capacitor/push-notifications` на iOS отдаёт сырой APNs-токен, и воркеру пришлось бы говорить с APNs по HTTP/2 и подписывать ES256 — лишняя работа. Отправка из воркера — FCM HTTP v1: OAuth-токен из сервисного аккаунта (JWT RS256 через WebCrypto), кеш на час.

**Сервер:**
- D1 `push_device`: `token` PK, `user_id`, `platform`, `app_version`, `created_at`, `last_seen_at`; индекс по `user_id`. Миграция `worker/migrations/NNNN_push_device.sql`.
- D1 `push_pref` (или колонка в профиле): какие события человек хочет. Настройка аккаунта, а не устройства — синхронизируется.
- `PUT /api/me/push-devices` `{ token, platform }`, `DELETE /api/me/push-devices/:token` (выход из аккаунта).
- Где рождается событие: `acceptInvite` и `syncGroup` (новые записи `dish`). Отправка — Cloudflare Queue: продюсер в запросе, консьюмер склеивает события группы за 1–2 минуты в одно уведомление и шлёт. Без очереди — `ctx.waitUntil`, но тогда десять блюд подряд = десять пушей.
- Ответ FCM `UNREGISTERED` → удалить токен.
- Текст уведомления собирает сервер (имя и название — из записей группы), в payload — `path` для тапа.

**Клиент** (`src/platform/push.ts`):
- Разрешение спрашиваем не при запуске, а в момент, когда понятна польза: после вступления в группу или создания приглашения — экран-объяснение (UX §3а, полноэкранный), потом системный запрос. Отказ — запоминаем, больше не спрашиваем; включить можно в Настройках.
- Токен регистрируем после входа и при `tokenReceived`; при выходе — удаляем.
- Тап (`notificationActionPerformed`) → `deepLinks` (§5).
- Пуш на открытом приложении — не показываем системный, запускаем синхронизацию.

**Веб-пуши PWA** (iOS 16.4+) — тем же сервером через VAPID; в бэклог, не в этот план.

## 7. OTA-обновления

**Можно ли.** Apple 3.3.1/2.5.2 разрешает обновлять JS/HTML без ревью, если не меняется назначение приложения. Google Play — то же. Нативный код (плагины, права) — только через магазин.

**Варианты:**

| | Хостинг | Цена | Замечания |
|---|---|---|---|
| **`@capgo/capacitor-updater`, ручной режим (рекомендую)** | наш: бандлы в R2, манифест — воркер | бесплатно | открытый код, проверка подписи бандла, откат, `notifyAppReady` |
| `@capawesome/capacitor-live-update` + свой хостинг | наш | бесплатно | похож, каналы из коробки |
| Capgo Cloud / Capawesome Cloud | их | от ~$12–14/мес | меньше своей инфраструктуры |
| Ionic Appflow | их | дорого, сворачивается | не берём |

**Схема (ручной режим):**

```
CI: pnpm build:native → dist.zip + sha256 + подпись (ключ в секретах CI)
      └→ R2 bundles/<channel>/<version>.zip
      └→ D1 app_bundle: version, channel, min_native, sha256, signature, rollout_percent, created_at

Приложение при запуске и на resume:
  GET /api/app/update?platform=ios&native=1.2.0&bundle=0.1.312&channel=production
    ← 204 | { version, url, sha256, signature }
  скачать в фоне → проверить подпись → next()  (применится при следующем запуске)
  в новом бандле: notifyAppReady() после первой успешной отрисовки,
  иначе через 10 с плагин откатывает на предыдущий
```

- **Когда применять.** Как у PWA сейчас: не перезагружать молча — можно потерять набранное. Скачанный бандл ставится при холодном старте; если приложение висит в памяти днями — тот же `UpdatePrompt` «Обновить» (через `src/platform/updates.ts`).
- **Совместимость с оболочкой.** `min_native` в манифесте: бандл, которому нужен новый плагин, старым оболочкам не отдаётся. В бандле — список ожидаемых плагинов; проверка в CI сравнивает `package.json` с прошлым релизом оболочки и ставит `min_native` автоматически.
- **Откат и данные.** Опасный случай: новый бандл поднял `CURRENT_VERSION` и мигрировал IndexedDB, потом откат на старый. Правило: код со старой `CURRENT_VERSION` при данных новее не трогает их, а показывает «Обнови приложение» (тест на фикстуре «версия из будущего» в `src/store/__tests__`). Для этого же — стор не пишет мигрированные данные, пока не прошёл `notifyAppReady`.
- **Совместимость с сервером.** Оболочки в магазинах живут месяцами. Протокол sync и `/api/*` меняются только с обратной совместимостью; ломающее — через `MIN_APP_VERSION` и 426 (§4).
- **Каналы:** `production`, `beta` (TestFlight / закрытое тестирование). Постепенная раскатка — `rollout_percent` по хешу id устройства.
- Публикация: `pnpm release:ota -- --channel beta`; в CI — после деплоя воркера, не раньше.

## 8. Этапы

**21 — Оболочка и платформенный слой.**
- Capacitor 7/8, `ios/`, `android/`, `capacitor.config.ts` (appId, имя «Порции»).
- `src/platform/*` для web; перевод `CopyButton`, `DishEditorForm`, `HoldButton`, `DataSection`, `UpdatePrompt` на него. Без нативного — веб работает как раньше.
- `build:native`, иконки и сплэш из `public/favicon.svg` (`@capacitor/assets`).
- Безопасные зоны, статус-бар, клавиатура, системная «назад» Android.
- Готово: приложение открывается на симуляторе и эмуляторе без сети, локальные блюда считаются, данные переживают перезапуск.

**22 — Роутинг на путях.**
- `createBrowserRouter`, SPA-fallback в воркере, перевод старых `#/` адресов, ссылки-приглашения и письма без хеша. Можно делать до 21 — полезно и PWA.

**23 — Сервер и вход для приложения.**
- Свой домен (CLOUDFLARE §12) — первым, до passkey в приложении (§4а).
- CORS, `bearer()`, secure storage токена, `X-App-Version`, 426.
- Passkey (§4а): `@capgo/capacitor-passkey`, перенос challenge через заголовок, origin Android-подписи, AASA и assetlinks, стейджинг.
- Удаление аккаунта (сервер + экран в «Аккаунте»).
- AASA и assetlinks, глубокие ссылки `/join/:code`, `/account/reset`.
- Готово: вход, синхронизация, приглашение по ссылке из мессенджера открывает приложение.

**24 — OTA и релиз.**
- Updater, `app_bundle`, R2, `/api/app/update`, подпись, откат, защита данных от отката.
- Магазины: аккаунты разработчика, политика конфиденциальности, App Privacy / Data safety, скриншоты, возрастной рейтинг, `ITSAppUsesNonExemptEncryption = NO`.
- CI: GitHub Actions + fastlane → TestFlight и Play «Внутреннее тестирование».
- Google Play: новым личным аккаунтам нужно закрытое тестирование с 12+ тестировщиками 14 дней до выхода в продакшн — начать как можно раньше.

**25 — Пуши.**
- Firebase, `push_device`, очередь, события из §6, экран разрешения, настройки.

Порядок: 22 → 21 → 23 → 24 (первая сборка в магазинах) → 25. Пуши после первого релиза: они не нужны для ревью, а лишняя причина отказа на старте ни к чему.

## 9. Решить с пользователем

1. **Бандл внутри (A) или `server.url` (B)** — §2. Рекомендую A.
2. **Вход в приложении:** bearer-токен Better Auth или CapacitorHttp-cookie — §4. Рекомендую bearer.
3. **Secure storage токена:** `@capgo/capacitor-native-biometric`/`capacitor-secure-storage-plugin`/`@aparajita/capacitor-secure-storage` — выбрать при этапе 23; рекомендую `@aparajita/capacitor-secure-storage` (Keychain/Keystore, живой).
4. **Роутер на путях** для веба тоже — §5. Рекомендую да.
5. **OTA:** Capgo-плагин со своим хостингом или облако — §7. Рекомендую свой хостинг: R2 и D1 уже есть, бесплатно.
6. **Пуши:** FCM через `@capacitor-firebase/messaging` (Firebase в зависимостях приложения) или APNs напрямую — §6. Рекомендую FCM.
7. **Passkey в приложении** (§4а), обязателен с первого релиза: плагин `@capgo/capacitor-passkey` (рекомендую) и рукописный перенос challenge через заголовок в воркере (~30 строк, рекомендую) вместо `CapacitorHttp`. Свой домен — до этапа 23: какой.
8. **Удаление аккаунта:** что с группой, где человек владелец (передать следующему участнику / удалить группу).
9. **Аккаунты разработчика:** на кого оформлять Apple Developer ($99/год) и Google Play ($25); оплата и юрисдикция могут потребовать времени — выяснить до этапа 24.

Новые зависимости после решения — в ARCHITECTURE §2, открытые — в §8.
