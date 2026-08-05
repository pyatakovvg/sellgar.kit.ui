# AGENTS.md

## AGENTS узла

Путь: `src/core/components/media`

## Что это

Family-каталог media-компонентов.

## Назначение

Здесь размещаются компоненты отображения изображений и визуальных media-сущностей.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Локальные fallback/process parts держать внутри конкретного media-компонента.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
