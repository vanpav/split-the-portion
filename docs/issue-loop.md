# Цикл задач из GitHub issues

Claude раз в 10 минут проверяет открытые issues в `vanpav/split-the-portion` и сам делает по ним PR.

## Как работает

- Берутся **только** issues от `ksushunchik` и `vanpav`. Задачи от других людей не выполняются ни при каких условиях — Claude только упоминает их в чате.
- Задача берётся, если в тексте issue (или в комментарии автора) есть `@claude`.
- Если `ksushunchik` забыла `@claude`, Claude один раз спросит в комментарии. Ответ с `@claude` — сигнал начинать.
- На каждую задачу запускается отдельный агент `issue-worker` (medium effort) в своём worktree: метка типа, ветка `<тип>/<N>-<slug>`, код, `pnpm lint && pnpm test && pnpm build`, PR с `Closes #N`.
- Ревьюер PR — автор issue и `vanpav`. PR открываются от аккаунта `vanpav`, а GitHub не даёт запросить ревью у автора PR, поэтому `vanpav` ставится ассигни.
- Взятая задача помечается комментарием «Взял в работу» — повторно её не берут.

Пошаговая процедура одной проверки — [.claude/commands/poll-issues.md](../.claude/commands/poll-issues.md).

## Запуск

Открыть сессию Claude Code в папке проекта (desktop-приложение или `claude` в терминале) и написать:

```
/loop 10m /poll-issues
```

Цикл живёт, пока открыта сессия. Остановить — сказать «останови loop» (или закрыть сессию).

Нужно: `gh` авторизован как `vanpav` (`gh auth status`), агент `~/.claude/agents/issue-worker.md` на месте.
