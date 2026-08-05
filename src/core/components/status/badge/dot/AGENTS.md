# AGENTS.md

## Тип документа

Локальный AGENTS дочернего узла компонента.

Путь: `src/core/components/status/badge/dot`.

## Что это

`Badge.Dot` — compound-вариант `Badge` с существующим компонентом `Dot`.

## Граница ответственности

- Использовать только существующий `Dot`; не рисовать круг локальной разметкой или CSS.
- Держать CSS варианта рядом с реализацией в `default.module.scss`.
- Не расширять основной public API `Badge` пропсами, специфичными для dot-варианта.
- Не добавлять props без визуального контракта: у dot-варианта нет `shape` и `stroke`, пока у него нет собственного фона или границы.
- Не экспортировать `BadgeDot` через общий public entrypoint отдельно от compound API `Badge.Dot`.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
