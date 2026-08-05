# AGENTS.md

## AGENTS узла

Путь: `src/core/components/navigation`

## Что это

Family-каталог navigation-компонентов.

## Назначение

Здесь размещаются компоненты навигации: sidebar, nav-bar, breadcrumbs, menu item, options и tab menu.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Не смешивать navigation с action, если компонент не описывает навигационный контекст.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
