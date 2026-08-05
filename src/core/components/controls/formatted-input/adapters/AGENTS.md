# AGENTS.md

## Тип документа

Структурный AGENTS.

Путь: `src/core/components/controls/formatted-input/adapters`.

## Что это

`adapters` — слой привязки core editor `FormattedInput` к конкретной UI-технологии.

## Назначение

Узел отделяет платформенный код от editor engine. React, Vue, Web Component или другой adapter должен связывать события, selection, focus и render с core commands/projection.

## Граница ответственности

- Adapter снимает input snapshot и selection из платформы.
- Adapter создаёт mount container для browser runtime.
- Adapter синхронизирует props и lifecycle browser runtime.
- Adapter предоставляет framework ref/API наружу.
- Adapter не реализует mask/date/money/number logic.
- Adapter не должен владеть raw/edit semantics.
- Adapter не должен рендерить symbols/caret/selection.

## Как реализован

- Текущий adapter: `react`.
- React adapter монтирует внутренний browser runtime.
- Общий public export компонента пока указывает на React adapter.

## Public API и локальные файлы

- Adapter не является самостоятельным public API.
- Public API остаётся на уровне `formatted-input/index.ts`.
- Внутренние файлы adapter импортировать напрямую из consumers нельзя.

## Контракт изменения

- Не переносить formatter logic из plugins/core в adapter.
- Не добавлять adapter-specific shortcut, который меняет raw/display contract.
- Если adapterу нужен новый command или state field, сначала добавить его в core model.

## Фактическое поведение

- React adapter создаёт DOM container.
- Browser runtime использует container как editor surface.
- Визуальное значение рендерится browser runtime из web projection.
- Browser runtime переводит keyboard/pointer/clipboard events в editor commands.

## Зависимости

- Adapter может зависеть от React и DOM lifecycle.
- Adapter не должен добавлять зависимости на `features`.

## Правила изменений

- Любую новую платформенную привязку класть отдельным каталогом.
- Держать adapter тонким: refs, lifecycle, props sync.
- Доменное поведение сначала проектировать в core.

## Риски и точки внимания

- Самый высокий риск — незаметно начать реализовывать formatter в React adapter.
- DOM selection и visual selection не равны raw selection после появления display formatting.
- IME/composition и clipboard должны проектироваться как command sources, а не как локальные React hacks.

## Технический долг

- Нет полного coverage всех `InputEvent.inputType`.
- Нет visual/raw selection bridge.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для React adapter проверять Storybook scenario `FormattedInput`.
