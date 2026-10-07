---
name: ru-ui-copy
description: Writes and edits Russian UI texts (buttons, errors, hints, empty states, notifications, onboarding), removing bureaucratese, English calques and signs of generated text. Use when writing or editing any Russian-language UI strings, localization files (ru.json, *.po, *.strings, *.arb), or when the user asks to make a text "livelier", "more human", "less synthetic" (живее, человечнее, менее синтетическим).
---

# Russian UI texts

Goal: text that a careful Russian-speaking person would write, not a translator or a neural network. Short, concrete, no decoration.

## Workflow

1. Find the strings: localization files or hardcoded in components. Read neighboring strings to learn the established tone and terms.
2. Check whether the project has a glossary or tone guide (`docs/`, `CONTRIBUTING`, `README`). If so, it takes precedence over this skill.
3. For each string, understand the context: where it is shown, what the user just did, what to do next. Without context, don't edit, ask.
4. Rewrite following the rules below.
5. Check against the checklist at the end.
6. If there are more than five edits, show a "key / was / now" table before writing to files.

### Do not touch

- Keys, placeholders (`{name}`, `%s`, `{{count}}`), tags and markup inside strings.
- Legal texts, product and plan names, glossary terms.
- Meaning. If the source string is ambiguous, ask, don't guess.
- Strings in other languages.

## What to remove

### Bureaucratese (канцелярит)

| Было | Стало |
|---|---|
| Осуществить оплату | Оплатить |
| Произвести настройку | Настроить |
| Данный файл | Этот файл / Файл |
| Является обязательным для заполнения | Обязательное поле |
| В случае возникновения ошибки | Если возникнет ошибка |
| В настоящее время недоступно | Сейчас недоступно |
| Необходимо выполнить вход | Войдите |
| При отсутствии подключения | Без интернета |

Rule: verb instead of verbal noun, short word instead of long, active instead of passive.

### English calques

| Было | Стало |
|---|---|
| Пожалуйста, введите ваш пароль | Введите пароль |
| Вы уверены, что хотите удалить этот файл? | Удалить файл? |
| Ваш файл был успешно загружен | Файл загружен |
| Что-то пошло не так | (конкретная причина и что делать) |
| Упс! | (убрать) |
| Узнать больше | Подробнее |
| Отправить (Submit) | Глагол по смыслу: Сохранить, Оплатить, Создать |
| Валидный / невалидный email | Неверный адрес почты |
| Нажмите здесь | Текст ссылки называет то, куда она ведёт |
| Добро пожаловать обратно! | (убрать или заменить делом) |
| Создать Новый Проект | Создать проект |
| Мы не смогли найти... | Ничего не найдено |

Rule: superfluous «пожалуйста», «ваш», «успешно», «был/была» are almost always removed. Capital letter only for the first word and proper nouns.

### Signs of generated text

- Promo adjectives: мощный, удобный, бесшовный, интуитивный, умный, современный, инновационный.
- Clichés: «раскройте потенциал», «на новый уровень», «всё в одном месте», «легко и быстро», «в пару кликов», «мы заботимся о».
- The "не просто X, а Y" construction.
- Lists of exactly three items without need.
- Exclamation marks and emoji as a way to look friendly.
- Introductory phrases before the point: «Обратите внимание, что», «Важно отметить», «Давайте начнём».
- Promises and judgments instead of facts: «Отличный выбор!», «Вы почти у цели!».
- Dashes for dramatic pause.
- Identical rhythm and length in consecutive strings.

The fix is always the same: say what happened or what to do, in plain words.

## How to write

### Tone

- Formal «вы» in lowercase. Capital «Вы» only in personal letters to one addressee. If the project uses «ты», follow the project.
- Even and to the point. No jokes in errors or where the user loses something.
- No «мы» where it can be avoided: «Не удалось сохранить», not «Мы не смогли сохранить».
- One term per entity. Don't alternate «удалить / стереть / убрать», «папка / каталог / директория».

### Gender and number

- Don't make the user read «зарегистрировался(-ась)», «уверен(а)». Rephrase: «Регистрация завершена», «Точно удалить?».
- Numerals need three forms, not two: 1 файл, 2 файла, 5 файлов. In code use ICU plural with categories `one`, `few`, `many`, `other`. If a string only has `one/other`, report it as a bug.
- Don't glue phrases from pieces: cases break. «Удалить {item}» with «папка» gives «Удалить папка». Use separate strings or rephrase: «Папка будет удалена».

### Length

Russian text is 20–30% longer than English. If a string doesn't fit, cut meaning, not words: drop the obvious instead of writing «Сохр.».

## Templates by element type

**Buttons.** Verb in infinitive, names the result: «Сохранить», «Удалить проект», «Пригласить». Not «Да / Нет / ОК» in dialogs with consequences, not a noun («Сохранение»).

**Confirmation dialogs.** Title is a question with the object, body states the consequence, button repeats the same action.
> Удалить проект «Альфа»?
> Файлы и комментарии пропадут. Восстановить не получится.
> [Удалить] [Отмена]

**Errors.** What happened and what to do. No blaming the user, no codes instead of explanation, no «попробуйте позже» if a more precise advice exists.
> Было: Произошла ошибка при загрузке файла. Пожалуйста, попробуйте снова.
> Стало: Файл больше 10 МБ. Сожмите его или выберите другой.

**Field validation.** State the condition, not the fact of error: «Минимум 8 символов», not «Некорректный пароль».

**Empty states.** What will appear here and how to start.
> Было: У вас пока нет проектов. Создайте свой первый проект прямо сейчас!
> Стало: Проектов пока нет. [Создать проект]

**Success notifications.** One or two words: «Сохранено», «Ссылка скопирована», «Письмо отправлено».

**Hints and placeholders.** Example value or format: «name@example.com», «ДД.ММ.ГГГГ». Don't duplicate the field label in the placeholder.

**Loading.** «Загружаем…», «Сохраняем…». No «Пожалуйста, подождите».

**Onboarding.** One action per screen, the title names the benefit, not the feature. No «Добро пожаловать» on every step.

## Typography

- Quotes «ёлочки», nested „лапки“.
- Dash — long, with spaces; in ranges short without spaces: 10–15 минут.
- Ellipsis as a single character: …
- Non-breaking space after short prepositions and conjunctions, between number and unit, before a dash: 5 МБ, 100 ₽, 15 %.
- Thousands separated by non-breaking space: 12 500 ₽. Decimal comma: 1,5 ГБ.
- Currency sign after the number.
- Date: 7 октября 2026 or 07.10.2026. Time: 15:30.
- No period at the end of titles, buttons, menu items and short notifications. In text of two or more sentences, use periods.
- Letter «ё»: as accepted in the project, but consistently.
- Abbreviations: «т. д.», «т. е.» with a non-breaking space; in UI better to avoid them.

## Working with other skills

If `ux-copy` and `humanizer` are installed, use them like this:

1. `ux-copy`: structure and text options (what to say, in which element).
2. `ru-ui-copy`: the Russian wording, by the rules of this file.
3. `humanizer`: only a final check for AI patterns.

When rules conflict for Russian strings, this file wins. In particular:
- don't apply the `humanizer` advice to "add personality and opinion": UI needs brevity;
- don't carry English norms (Title Case, "please", straight quotes) over from `ux-copy`;
- English strings are edited by `ux-copy` and `humanizer`; this file does not apply to them.

## Checklist before handing off

- [ ] Can one more word be removed without losing meaning?
- [ ] No «пожалуйста», «ваш», «успешно», «данный», «является», «осуществить»?
- [ ] No promo adjectives, exclamation marks, emoji?
- [ ] Does the error say what to do next?
- [ ] Does the button name the action with a verb?
- [ ] Do terms match the rest of the interface?
- [ ] No «(а)», «(-ась)», phrases glued from pieces?
- [ ] Does plural work for 1, 2, 5, 21?
- [ ] Placeholders, keys and markup intact?
- [ ] Quotes, dashes, non-breaking spaces in place?
- [ ] Read aloud: would a person say this to a colleague at the next desk?
