# AGENTS.md

## AGENTS узла

Путь: `src/core/components/content`

## Что это

Family-каталог content-компонентов.

## Назначение

Здесь размещаются компоненты для отображения текста, иконок и смыслового контента без владения вводом или overlay lifecycle.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Не смешивать content с feedback/status, если компонент описывает состояние или процесс.
- Внутренние parts держать внутри каталога конкретного компонента.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
