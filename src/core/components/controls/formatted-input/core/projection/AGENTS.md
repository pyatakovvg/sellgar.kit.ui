# AGENTS.md

## Тип документа

Структурный AGENTS.

Путь: `src/core/components/controls/formatted-input/core/projection`.

## Что это

Web-oriented projection слой `FormattedInput`.

## Назначение

Узел строит render model из editor state без зависимости от React или DOM runtime.

## Граница ответственности

- Преобразует document/caret/selection в web render boxes.
- Описывает className, data attrs, css vars и inline style config.
- Не создаёт DOM nodes.
- Не вызывает React.
- Не меняет editor state.

## Как реализован

- Public/local entrypoint: `index.ts`.
- Render model types: `web-render-model.ts`.
- Builder: `web-projection-builder.ts`.

## Public API и локальные файлы

- `FormattedInputWebProjectionBuilder`
- `IFormattedInputWebRenderModel`
- `IFormattedInputSymbolRenderBox`
- `IFormattedInputCaretRenderBox`
- `IFormattedInputSelectionRenderBox`

## Контракт изменения

- Projection не должна менять state.
- Web render model может быть CSS/DOM-compatible, но не React-specific.
- Browser runtime должен рендерить эту модель, а не обходить её.

## Фактическое поведение

- Identity projection строит один или несколько line boxes.
- Symbol boxes получают роль, rawOffset, visualOffset, className и style config.
- Caret/selection boxes пока строятся по raw/visual 1:1.

## Зависимости

- Только `../domain`.

## Правила изменений

- Не добавлять React imports.
- Не добавлять browser API.
- Style config держать в CSS-compatible форме.

## Риски и точки внимания

- Selection rendering пока не покрывает split ranges и formatted mapping.

## Технический долг

- Нет layout measurement.
- Нет visual/raw mapping service.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
