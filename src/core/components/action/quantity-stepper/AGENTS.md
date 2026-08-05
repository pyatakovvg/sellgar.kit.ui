# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/action/quantity-stepper`.

## Что это

`QuantityStepper` — компонент в срезе `core/components`.

## Назначение

Action/control composition для изменения числового значения через decrement/increment.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/action/quantity-stepper/index.ts`.
- Source: `src/core/components/action/quantity-stepper/quantity-stepper.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { QuantityStepper } from './quantity-stepper.tsx';`
- Consumer import: `import { QuantityStepper } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `QuantityStepper`.
- Props из `IProps`: `shape`, `size`, `outline`, `leftActionSize`, `rightActionSize`, `leftActionDisabled`, `rightActionDisabled`, `leftActionType`, `rightActionType`, `value`, `onLeftActionClick`, `onRightActionClick`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { QuantityStepper } from './quantity-stepper.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `shape`, `size`, `outline`, `leftActionSize`, `rightActionSize`, `leftActionDisabled`, `rightActionDisabled`, `leftActionType`, `rightActionType`, `value`, `onLeftActionClick`, `onRightActionClick`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../../../icons`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Composition может собирать primitives/subcomponents, но не должна становиться владельцем focus/open/selection lifecycle без переноса в `interactions`.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Главный риск — незаметно изменить props, DOM structure или визуальный contract через основной import `@sellgar/kit`.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован; при новых находках дополнять этот раздел конкретными фактами.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/quantity-stepper/quantity-stepper.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
