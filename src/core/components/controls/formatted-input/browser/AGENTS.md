# AGENTS.md

## Тип документа

Структурный AGENTS.

Путь: `src/core/components/controls/formatted-input/browser`.

## Что это

`browser` — framework-agnostic runtime слой `FormattedInput` для DOM surface, view parts и browser events.

## Назначение

Узел связывает чистый editor core с браузерным DOM без React-зависимости.

## Граница ответственности

- Создаёт и обновляет DOM surface внутри переданного mount container.
- Рендерит projection: lines, symbols и синхронизирует native DOM Selection.
- Преобразует keyboard, pointer и clipboard events в editor commands.
- Вызывает transaction engine и отдаёт raw `onChange`.
- Не содержит React, JSX или framework lifecycle.
- Не реализует mask/date/money/number plugins.
- Не использует native `<input>` или `<textarea>` как editor surface.

## Как реализован

- Public/local entrypoint: `index.ts`.
- Browser editor orchestration: `editor.ts`.
- DOM renderer: `dom-renderer.ts`.
- View parts: `symbol-view.ts`, `line-view.ts`.
- Controllers: `keyboard-controller.ts`, `pointer-controller.ts`.
- CSS class contract: `class-names.ts`.
- Concrete stylesheet is supplied by the adapter through `class-names.ts` contract.

## Контракт изменения

- DOM не является источником raw value, caret или selection state.
- Selection живёт в editor state/browser editor state, а browser runtime проецирует его в native DOM Selection.
- Native DOM Selection используется для системного выделения и нативного context menu; custom selection overlay в этом слое не используется.
- Symbol DOM metadata is owned by `FormattedInputSymbolView`; external DOM selector scans are not the primary layout API.
- Framework adapters не должны дублировать logic из этого слоя.
- Browser bridge для IME/mobile/clipboard можно добавлять только отдельным согласованным этапом.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- После изменений проверять Storybook scenario `FormattedInput`.
