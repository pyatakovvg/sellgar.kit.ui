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

## Готовые опшены

SelectOption и ExtendedOption перенесены для новых селектов. Они экспортируются
дополнительно; существующий Option сохраняет свой контракт.
