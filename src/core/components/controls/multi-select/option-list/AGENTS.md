# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/multi-select/option-list`.

## Что это

`OptionList` — локальная часть `MultiSelect`.

## Назначение

Рендерит список options для множественного выбора, включая select-all строку.

## Граница ответственности

- Узел является implementation detail `MultiSelect`.
- Не является public API и не должен экспортироваться в общий barrel.
- Не должен зависеть от внутренностей соседних компонентов вроде `Select`.
- Поведенческую навигацию получает через `core/systems/floating`.
- Визуальные option items собирает из локального `multi-select/option`.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Проверять вместе с `MultiSelect` и `MultiSelect.Button` в Storybook.
