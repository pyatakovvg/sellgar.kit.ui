# AGENTS.md

## AGENTS узла

Путь: `src/core/components/status`

## Что это

Family-каталог status-компонентов.

## Назначение

Здесь размещаются компактные компоненты состояния и маркировки: badge, caption, dot, label.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Не смешивать status с feedback, если компонент не описывает процесс или результат действия.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
