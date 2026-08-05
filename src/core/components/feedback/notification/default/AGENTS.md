# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/feedback/notification/default`.

## Что это

`Default` — компонент в срезе `core/components`.

## Назначение

Default visual variant parent-компонента; не является самостоятельным public API.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/feedback/notification/default/index.ts`.
- Source: `src/core/components/feedback/notification/default/default.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Default } from './default.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `Default`.
- Props из `IProps`: `status`, `title`, `description`, `slot`, `onClose`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Default } from './default.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `status`, `title`, `description`, `slot`, `onClose`. Новые/изменённые props нужно отражать в story и документации.
- При `cloneElement` явно сохранять порядок приоритета props родителя и ребёнка.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../../../../icons`, `../../../../primitives/content/typography`, `./default.module.scss`.

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
- Parent Storybook scenario: `../../clients/storybook/src/kit/symbols/notification/notification-default.stories.tsx`. Проверять изменение через parent-сценарий, потому что отдельной story для scoped/internal части нет.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
