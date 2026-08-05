# AGENTS.md

## AGENTS узла

Путь: `src/core/components/data`

## Что это

Family-каталог data-компонентов.

## Назначение

Здесь размещаются компоненты отображения и управления структурированными данными, например Table.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Не выносить table feature/runtime в `systems`, пока он обслуживает только Table.
- Сохранять внутренние feature-папки внутри компонента.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
