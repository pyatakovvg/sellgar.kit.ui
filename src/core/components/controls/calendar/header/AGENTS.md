# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/calendar/header`.

## Что это

`Header` — компонент в срезе `core/components/controls`.

## Назначение

Внутренний header parent-компонента: отображает заголовок и управляющие действия текущего блока.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/calendar/header/index.ts`.
- Source: `src/core/components/controls/calendar/header/header.tsx`.
- Собственных child nodes нет.
- Стрелки месяца рендерятся как `button`, чтобы работать через Tab/Enter/Space.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Header } from './header.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `Header`.
- Props из `IProps`: `year`, `month`, `onPrevMonthClick`, `onNextMonthClick`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Header } from './header.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `year`, `month`, `onPrevMonthClick`, `onNextMonthClick`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Стрелки месяца рендерятся как `button`, чтобы работать через Tab/Enter/Space.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `../../../../../icons`, `../../../../components/content/typography`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
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
- Parent Storybook scenario: `../../clients/storybook/src/kit/core/components/controls/calendar/calendar.stories.tsx`. Проверять изменение через parent-сценарий, потому что отдельной story для scoped/internal части нет.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
