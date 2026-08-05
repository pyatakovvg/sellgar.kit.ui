# AGENTS.md

## AGENTS узла

Путь: `src/core/components/controls`

## Что это

Family-каталог controls-компонентов.

## Назначение

Здесь размещаются компоненты пользовательского ввода и выбора: input, select, datepicker, calendar, checkbox, radio и связанные специализированные controls.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Внутренний runtime сложных controls держать рядом с компонентом, если он не переиспользуется несколькими компонентами.
- Общий runtime переносить в `src/core/systems`.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
