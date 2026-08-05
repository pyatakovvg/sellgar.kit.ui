# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/radio/element`.

## Что это

`Element` — компонент в срезе `core/components`.

## Назначение

Внутренний visual/control element для Radio: отвечает за отображение выбранного состояния внутри parent `Radio`.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/radio/element/index.ts`.
- Source: `src/core/components/controls/radio/element/element.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Рендерит native `<input>`; сохранять value/onChange contract и accessibility attributes.
- Checked visual state должен сохранять selected border color на hover; hover не должен придумывать новый цвет, если задача просит только тень.

## Public API и локальные файлы

- `export { Element } from './element.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `Element`, `IProps`.
- Props из `IProps`: `size`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Element } from './element.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `size`. Новые/изменённые props нужно отражать в story и документации.
- Native `<input>` нельзя менять без пересмотра value/onChange/focus/accessibility contract.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Рендерит native `<input>`; сохранять value/onChange contract и accessibility attributes.
- Checked visual state должен сохранять selected border color на hover; hover не должен придумывать новый цвет, если задача просит только тень.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
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
- Parent Storybook scenario: `../../clients/storybook/src/kit/symbols/radio/radio.stories.tsx`. Проверять изменение через parent-сценарий, потому что отдельной story для scoped/internal части нет.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
