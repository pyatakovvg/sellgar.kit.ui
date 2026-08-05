# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/formatted-input/adapters/react`.

## Что это

React adapter для core editor `FormattedInput`.

## Назначение

Adapter связывает React props, ref и lifecycle с browser runtime `FormattedInput`.

## Граница ответственности

- Рендерит только mount container.
- Создаёт и уничтожает browser runtime.
- Передаёт controlled props в browser runtime.
- Прокидывает controlled raw value через `onChange`.
- Не обрабатывает keyboard/pointer/clipboard events.
- Не рендерит symbols/caret/selection.
- Не реализует formatter logic.
- Не является местом для mask/date/money/number algorithms.

## Как реализован

- Public/local entrypoint: `index.ts`.
- Source: `formatted-input.tsx`.
- CSS module: `default.module.scss`, рядом с React source that imports it.
- Parent `formatted-input.tsx` переэкспортирует этот adapter как текущую React-реализацию компонента.

## Public API и локальные файлы

- `FormattedInput`
- `IFormattedInputProps`
- `IFormattedInputChangeMeta`
- Consumer import должен идти через `@sellgar/kit`, не через `adapters/react`.

## Контракт изменения

- Не менять `value`/`onChange` raw contract.
- Не добавлять formatter behavior в adapter.
- Сохранять ref как public instance facade.
- Native props, `aria-*`, `data-*`, `disabled`, `readOnly` должны доходить до mount container/browser runtime.

## Фактическое поведение

- Controlled-only.
- Single-line UI.
- Создаёт focusable browser runtime container.
- Прокидывает opaque `plugins` runtime configuration в browser editor.
- Не использует `<input>` или `<textarea>` как editor surface.
- Не переводит events в commands.

## Зависимости

- React.
- Browser runtime через `../../browser`.

## Правила изменений

- Перед расширением adapter проверить, нельзя ли сначала добавить behavior в browser runtime или core.
- Не добавлять локальные hacks для caret, paste или mask.
- Browser API для editor surface не держать в React adapter.

## Риски и точки внимания

- Adapter не владеет visual/raw mapping.
- Display value может отличаться от raw value после будущих plugins.

## Технический долг

- Нет полного coverage всех `InputEvent.inputType`.
- Нет visual/raw selection mapping.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Storybook: `Kit/Controls/FormattedInput`.
