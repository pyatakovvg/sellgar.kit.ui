# AGENTS.md

## AGENTS узла

Путь: `src/core/components/overlay`

## Что это

Family-каталог overlay-компонентов.

## Назначение

Здесь размещаются пользовательские overlay-компоненты: modal, drawer, popover, tooltip.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Общий overlay/floating runtime не держать в этой family, если он переиспользуется несколькими overlay/controls-компонентами; для этого есть `src/core/systems`.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
