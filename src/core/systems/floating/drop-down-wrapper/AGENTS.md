# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/systems/floating/drop-down-wrapper`.

## Что это

`DropDownWrapper` — компонент в срезе `core/systems/floating`.

## Назначение

Floating layout wrapper для выпадающих слоев с единым контейнером и shadow contract.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/systems/floating/drop-down-wrapper/index.ts`.
- Source: `src/core/systems/floating/drop-down-wrapper/drop-down.wrapper.tsx`.
- Собственных child nodes нет.
- Работает с refs; изменение DOM target или ref type может быть breaking change.

## Public API и локальные файлы

- `export { DropDownWrapper } from './drop-down.wrapper.tsx';`
- Consumer import: `import { DropDownWrapper } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `DropDownWrapper`.
- Props из `IProps`: `ref`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { DropDownWrapper } from './drop-down.wrapper.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `ref`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Работает с refs; изменение DOM target или ref type может быть breaking change.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `../../scroll/scrollbar`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
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
- Storybook scenario: `../../clients/storybook/src/kit/wrappers/drop-down-wrapper/drop-down-wrapper.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
