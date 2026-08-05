# AGENTS.md

## AGENTS узла

Путь: `src/core/components/user`

## Что это

Family-каталог user-компонентов.

## Назначение

Здесь размещаются компоненты отображения пользователя и связанных user-parts.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Локальные user parts держать внутри каталога компонента.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
