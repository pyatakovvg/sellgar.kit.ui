# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/select/empty`.

## Что это

`Empty` — компонент в срезе `core/components/controls`.

## Назначение

Внутреннее empty-state представление для parent control: отображает отсутствие доступных options/items.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/select/empty/index.ts`.
- Source: `src/core/components/controls/select/empty/empty.tsx`.
- Собственных child nodes нет.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.

## Public API и локальные файлы

- `export { Empty } from './empty.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `Empty`, `IProps`.
- Props из `IProps`: `title`, `disabled`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Empty } from './empty.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `title`, `disabled`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `../../../../components/content/typography`, `./default.module.scss`.

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
- Parent Storybook scenario: `../../clients/storybook/src/kit/symbols/select/select.stories.tsx`. Проверять изменение через parent-сценарий, потому что отдельной story для scoped/internal части нет.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
