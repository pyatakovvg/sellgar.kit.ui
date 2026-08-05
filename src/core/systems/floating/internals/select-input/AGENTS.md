# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/systems/floating/internals/select-input`.

## Что это

`SelectInput` — компонент в срезе `core/systems/floating`.

## Назначение

Внутренний input-like trigger для select-family controls.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/systems/floating/internals/select-input/index.ts`.
- Source: `src/core/systems/floating/internals/select-input/select-input.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Не владеет keyboard focus lifecycle; focus lifecycle остаётся у parent interaction/reference wrapper.
- Может отображать keyboard-focus visual state через `isKeyboardFocused`, если parent interaction передаёт это состояние явно.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { SelectInput } from './select-input.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `SelectInput`, `IProps`.
- Props из `IProps`: `ref`, `leadIcon`, `tailIcon`, `badge`, `size`, `target`, `isOpen`, `isFocused`, `isKeyboardFocused`, `isClearable`, `fixHeight`, `onClear`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { SelectInput } from './select-input.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `ref`, `leadIcon`, `tailIcon`, `badge`, `size`, `target`, `isOpen`, `isFocused`, `isKeyboardFocused`, `isClearable`, `fixHeight`, `onClear`. Новые/изменённые props нужно отражать в story и документации.
- `isKeyboardFocused` должен менять визуальное состояние того же wrapper, который владеет border/background поля; не рисовать вторую focus-рамку на внешнем reference wrapper.
- При `cloneElement` явно сохранять порядок приоритета props родителя и ребёнка.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Не владеет keyboard focus lifecycle; focus lifecycle остаётся у parent interaction/reference wrapper.
- Может отображать keyboard-focus visual state через `isKeyboardFocused`, если parent interaction передаёт это состояние явно.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../../../icons`, `../../../../components`, `./default.module.scss`.

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
- Storybook scenario не найден автоматически; перед поведенческой правкой найти parent scenario или добавить релевантный scenario.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
