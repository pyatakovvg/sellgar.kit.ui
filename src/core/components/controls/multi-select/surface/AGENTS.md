# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/multi-select/surface`.

## Что это

`Surface` — локальный visual shell для floating layer компонента `MultiSelect`.

## Назначение

Изолирует desktop popover и mobile sheet представления `MultiSelect`.

## Граница ответственности

- Узел является implementation detail `MultiSelect`.
- Не является public API и не должен экспортироваться в общий barrel.
- Не должен импортировать внутренности `Select` или других соседних controls.
- Не должен попадать в `core/systems/floating`, потому что содержит view и стили.
- `core/systems/floating` остаётся headless-слоем позиционирования, focus и open state.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Проверять desktop popover и mobile sheet сценарии `MultiSelect`.
