# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/controls/calendar/inputs`.

## Что это

`Inputs` — interaction-компонент в срезе `core/components/controls`.

## Назначение

Внутренний блок inputs для Calendar: отвечает за ввод даты/времени внутри parent calendar lifecycle.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `controls`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/calendar/inputs/index.ts`.
- Source: `src/core/components/controls/calendar/inputs/inputs.tsx`.
- Child node: `src/core/components/controls/calendar/inputs/controls`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Работает с датой/временем; проверять timezone, locale и controlled value loop.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Inputs } from './inputs.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `Inputs`.
- Props из `IProps`: `value`, `onChange`, `onCancel`.
- Локальные parts: `controls`.

## Контракт изменения

- Не менять локальные exports (`export { Inputs } from './inputs.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `value`, `onChange`, `onCancel`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Работает с датой/временем; проверять timezone, locale и controlled value loop.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- `onCancel` сбрасывает локальные date/time поля к текущему `value`, очищает validation state и передаёт cancel наверх.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `moment`.
- Локальные imports: `../../../..`, `../../../../components/status/label`, `../../../../components/controls/input-mask`, `./controls`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Главный риск — незаметно изменить props, DOM structure или визуальный contract через основной import `@sellgar/kit`.

## Технический долг

- Проверить hardcoded UI-тексты и i18n/API contract перед добавлением новых строк.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Parent Storybook scenario: `../../clients/storybook/src/kit/symbols/calendar/calendar.stories.tsx`. Проверять изменение через parent-сценарий, потому что отдельной story для scoped/internal части нет.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
