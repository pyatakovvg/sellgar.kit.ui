# AGENTS.md

## AGENTS узла

Путь: `src/core/systems/floating`

## Что это

Runtime-система floating-поведения.

## Назначение

Здесь живут dropdown/floating helpers и internals, которые переиспользуются select, multi-select, datepicker и overlay-компонентами.

## Правила изменений

- `popover` и `tooltip` как пользовательские компоненты находятся в `src/core/components/overlay`.
- Internal floating parts не импортировать потребителям напрямую в обход локального компонента, если это не существующий public helper.
- Сохранять `index.ts` как точку экспорта системы.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
