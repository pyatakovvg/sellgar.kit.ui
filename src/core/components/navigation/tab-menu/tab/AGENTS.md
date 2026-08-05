# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/tab-menu/tab`.

## Что это

`Tab` — компонент в срезе `core/components`.

## Назначение

Общий compound tab item для `TabMenu`; отвечает за выбор visual renderer по ближайшему variant context.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `fill`, `line`, `segmented`.

## Как реализован

- Public/local entrypoint: `src/core/components/navigation/tab-menu/tab/index.ts`.
- Source: `src/core/components/navigation/tab-menu/tab/tab.tsx`.
- Child node: `src/core/components/navigation/tab-menu/tab/fill`.
- Child node: `src/core/components/navigation/tab-menu/tab/line`.
- Child node: `src/core/components/navigation/tab-menu/tab/segmented`.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Клонирует `badge` slot по примеру `Button`: размер badge управляется размером вкладки, `disabled` приходит от вкладки.

## Public API и локальные файлы

- `export { Tab } from './tab.tsx';`
- `export type { IProps } from './tab.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `Tab`, `IProps`.
- Props из `IProps`: `name`, `title`, `leadIcon`, `tailIcon`, `badge`, `disabled`, `onClick`.
- Локальные parts: `fill`, `line`, `segmented`.

## Контракт изменения

- Не менять локальные exports (`export { Tab } from './tab.tsx';`, `export type { IProps } from './tab.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `name`, `title`, `leadIcon`, `tailIcon`, `badge`, `disabled`, `onClick`. Новые/изменённые props нужно отражать в story и документации.
- `type`, `style`, `size`, `shape`, `isActive` не являются public props `Tab`; они приходят из контекстов `TabMenu`.

## Фактическое поведение

- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Использует root context и variant context. Использование вне `TabMenu` или вне variant считается ошибкой композиции.
- Клонирует `badge` slot по примеру `Button`: `lg`/`md` используют `Badge size="md"`, `sm` использует `Badge size="sm"`.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `./fill`, `./line`, `./segmented`, `../tab.context.ts`.

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
- Parent Storybook scenario: `../../clients/storybook/src/kit/symbols/tab-menu/tab-menu.stories.tsx`. Проверять изменение через parent-сценарий, потому что отдельной story для scoped/internal части нет.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
