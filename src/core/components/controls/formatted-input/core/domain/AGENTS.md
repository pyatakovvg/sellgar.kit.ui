# AGENTS.md

## Тип документа

Структурный AGENTS.

Путь: `src/core/components/controls/formatted-input/core/domain`.

## Что это

Доменная модель редактора `FormattedInput`.

## Назначение

Узел описывает immutable-ish ООП-модели документа: символы, группы, линии, документ, позиции, каретку, выделение и состояние редактора.

## Граница ответственности

- Хранит модели и factories домена.
- Не выполняет DOM events.
- Не рендерит React.
- Не содержит mask/date/money/number algorithms.
- Не содержит transaction dispatch.

## Как реализован

- Public/local entrypoint: `index.ts`.
- Модели символов: `symbol.ts`.
- Композиция документа: `group.ts`, `line.ts`, `document.ts`.
- Позиционирование: `position.ts`, `caret.ts`, `selection.ts`.
- State factory: `state.ts`.
- Style config: `style.ts`.

## Public API и локальные файлы

- `FormattedInputSymbolConfig`
- `FormattedInputSymbolNode`
- `FormattedInputGroup`
- `FormattedInputLine`
- `FormattedInputDocument`
- `FormattedInputPosition`
- `FormattedInputCaret`
- `FormattedInputSelection`
- `FormattedInputEditorState`
- `createFormattedInputEditorState`

## Контракт изменения

- Symbol config не должен знать свою позицию в документе.
- Позиция живёт в node/position/mapping слое.
- Core style config должен быть CSS-compatible, но не DOM-specific.
- Document может быть single-line на первом этапе, но модель не должна запрещать несколько lines.

## Фактическое поведение

- Identity document создаёт одну line, одну group и editable symbols.
- Raw value и display value в identity mode совпадают.
- Selection хранит anchor/focus caret.

## Зависимости

- Внешних runtime dependencies нет.

## Правила изменений

- Не добавлять React/DOM imports.
- Не мутировать входные объекты.
- Новое поведение редактирования добавлять в `editor`, не в domain models.

## Риски и точки внимания

- Сейчас raw/visual mapping 1:1.
- Grapheme-aware индексации ещё нет.

## Технический долг

- Нет отдельного mapping service.
- Нет group-specific editing rules.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
