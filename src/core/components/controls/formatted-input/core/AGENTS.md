# AGENTS.md

## Тип документа

Структурный AGENTS.

Путь: `src/core/components/controls/formatted-input/core`.

## Что это

`core` — чистый редакторный слой `FormattedInput` без React и DOM.

## Назначение

Узел хранит доменную модель, команды, транзакции и web-oriented projection для форматируемого редактора ввода.

## Граница ответственности

- Отвечает за document model: symbol config/node, group, line, document.
- Отвечает за caret, position, selection и editor state.
- Отвечает за command -> transaction -> next state.
- Отвечает за projection в web render model.
- Не импортирует React.
- Не обращается к DOM и browser APIs.
- Не рендерит UI.
- Не содержит готовые formatter plugins.

## Как реализован

- Public/local entrypoint: `core/index.ts`.
- Domain model: `domain`.
- Editor commands/transactions: `editor`.
- Web-oriented render projection: `projection`.

## Public API и локальные файлы

- `index.ts` экспортирует core model, editor services и projection types, которые нужны React adapter, stories и будущим tests/plugins.
- Файлы внутри `core` являются implementation modules за ближайшим `index.ts`.
- Consumer import через общий `@sellgar/kit` допустим только для типов и helpers, которые явно экспортированы из parent `formatted-input/index.ts`.

## Контракт изменения

- Не добавлять React/DOM-типы в `core`.
- Не менять document/caret/selection/transaction contract без обновления `DOMAIN.md`.
- Если команда меняет raw value, transaction должна вернуть новое состояние и selection.
- Не добавлять готовую маску, дату, сумму или number formatting в базовый editor engine.

## Фактическое поведение

- `domain` строит identity document из raw value.
- `editor` применяет identity commands: insert, delete, paste, copy, cut, move caret, set selection.
- `projection` строит web render model из editor state.
- Selection пока нормализуется по raw length; visual/raw mapping 1:1.

## Зависимости

- Внешние runtime dependencies отсутствуют.
- React и DOM dependencies запрещены.

## Правила изменений

- Держать функции маленькими и pure.
- Для ordered tokens использовать массивы.
- Не вводить `Map`, `Set` или классы без реальной необходимости.
- Новые plugin-independent helpers добавлять сюда только если они нужны нескольким editor services, projection или adapter.

## Риски и точки внимания

- Selection mapping будет главным источником регрессий при расхождении raw и display.
- Transaction order влияет на поведение будущих plugins.
- Render result не должен протаскивать React-зависимость в core.

## Технический долг

- Нет visual/raw mapping для formatted display.
- Нет mask/date/money/number plugins.
- Нет plugin composition contract.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- После изменения editor behavior проверять Storybook scenario `FormattedInput`.
