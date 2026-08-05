# AGENTS.md

## AGENTS узла

Путь: `src/core/components/layout`

## Что это

Family-каталог layout-компонентов.

## Назначение

Здесь размещаются компоненты структуры и контейнеризации: card, container, divider, scrollbar.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Не добавлять сюда business/content-компоненты только из-за визуального контейнера.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
