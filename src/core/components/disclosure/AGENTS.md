# AGENTS.md

## AGENTS узла

Путь: `src/core/components/disclosure`

## Что это

Family-каталог disclosure-компонентов.

## Назначение

Здесь размещаются компоненты раскрытия и сворачивания контента.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Runtime, принадлежащий одному disclosure-компоненту, держать внутри его каталога.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
