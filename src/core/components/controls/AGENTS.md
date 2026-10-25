# AGENTS.md

## AGENTS узла

Путь: `src/core/components/controls`

## Что это

Family-каталог controls-компонентов.

## Назначение

Здесь размещаются компоненты пользовательского ввода и выбора: input, select, datepicker, calendar, checkbox, radio и связанные специализированные controls.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Внутренний runtime сложных controls держать рядом с компонентом, если он не переиспользуется несколькими компонентами.
- Общий runtime переносить в `src/core/systems`.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.

## Новые семейства выбора

NewSelect объединяет отдельные Simple, Multiple, Tree и Multiple.Tree.
NewSelectList.Multiple.Tree — самостоятельный inline-список. Они добавлены рядом
с существующими Select/MultiSelect/SelectTree/MultiSelectTree без замены их API.
Контракты и проверки описаны в локальных AGENTS семейств.
