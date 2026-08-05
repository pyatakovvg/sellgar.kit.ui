# AGENTS.md

## Тип документа

Структурный AGENTS.

Путь: `src/core/components/controls/formatted-input/core/editor`.

## Что это

Редакторный command/transaction слой `FormattedInput`.

## Назначение

Узел применяет команды ввода к `FormattedInputEditorState` и возвращает transaction result.

## Граница ответственности

- Преобразует command в operations.
- Возвращает before/after state.
- Отвечает за insert, delete, paste, copy, cut, move caret и set selection в identity mode.
- Не читает DOM events.
- Не рендерит UI.
- Не реализует mask/date/money/number rules.

## Как реализован

- Public/local entrypoint: `index.ts`.
- Commands: `command.ts`.
- Operations: `operation.ts`.
- Transaction result: `transaction.ts`.
- Selection service: `selection-service.ts`.
- Selection boundary resolver: `selection-boundary-resolver.ts`.
- Dispatch: `transaction-engine.ts`.

## Public API и локальные файлы

- `FormattedInputTransactionEngine`
- `FormattedInputSelectionService`
- `FormattedInputSelectionBoundaryResolver`
- `TFormattedInputEditorCommand`
- `TFormattedInputEditorOperation`
- `IFormattedInputTransactionResult`

## Контракт изменения

- Любая команда должна возвращать transaction result.
- Команды, меняющие raw, должны возвращать after state с нормализованной selection.
- Clipboard операции должны работать с raw text.

## Фактическое поведение

- Insert/paste заменяют selection.
- Backspace/delete удаляют selection или один символ слева/справа от caret.
- Copy/cut работают по raw range selection.
- Move caret работает по raw offset.
- Double-click boundary resolver returns raw ranges without DOM knowledge.

## Зависимости

- Только `../domain`.

## Правила изменений

- Не добавлять DOM/React imports.
- Не добавлять plugin hooks до отдельного этапа plugin contract.
- Не добавлять formatter-specific rules в identity engine.

## Риски и точки внимания

- Пока document пересобирается из raw после каждой raw mutation.
- При появлении mask/group rules нужно заменить identity replacement на group-aware операции.

## Технический долг

- Нет undo/redo history.
- Нет composition/IME command model.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
