# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/tab-menu/tab/line`.

## Что это

`LineTab` — компонент в срезе `core/components`.

## Назначение

Внутренний visual renderer для одной вкладки внутри `TabMenu.Line`.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/navigation/tab-menu/tab/line/index.ts`.
- Source: `src/core/components/navigation/tab-menu/tab/line/line.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { LineTab } from './line.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `LineTab`.
- Props из `IProps`: `size`, `isActive`, `title`, `name`, `id`, `ariaControls`, `leadIcon`, `tailIcon`, `badge`, `disabled`, `onClick`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { LineTab } from './line.tsx';`) без оценки parent API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `size`, `isActive`, `title`, `name`, `id`, `ariaControls`, `leadIcon`, `tailIcon`, `badge`, `disabled`, `onClick`.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../../content/typography`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Composition может собирать primitives/subcomponents, но не должна становиться владельцем focus/open/selection lifecycle без переноса в `interactions`.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.

## Технический долг

- Решить contract для consumer `className`: merge, запрет или отдельный slot API.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Parent Storybook scenario: `../../clients/storybook/src/kit/symbols/tab-menu/tab-menu.stories.tsx`. Проверять изменение через parent-сценарий, потому что отдельной story для scoped/internal части нет.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
