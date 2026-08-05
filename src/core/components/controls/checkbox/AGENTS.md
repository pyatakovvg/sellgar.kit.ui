# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/checkbox`.

## Что это

`Checkbox` — компонент в срезе `core/components`.

## Назначение

Boolean control primitive с label/caption и indeterminate visual state.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `element`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/checkbox/index.ts`.
- Source: `src/core/components/controls/checkbox/checkbox.tsx`.
- Child node: `src/core/components/controls/checkbox/element`.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Storybook должен показывать базовые checked/unchecked/indeterminate/disabled states, включая `indeterminate + disabled`.

## Public API и локальные файлы

- `export { Checkbox } from './checkbox.tsx';`
- Consumer import: `import { Checkbox } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Checkbox`, `IProps`.
- Props из `IProps`: `size`, `label`, `caption`, `isIndeterminate`.
- Локальные parts: `element`.

## Контракт изменения

- Не менять локальные exports (`export { Checkbox } from './checkbox.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `size`, `label`, `caption`, `isIndeterminate`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Storybook должен показывать базовые checked/unchecked/indeterminate/disabled states, включая `indeterminate + disabled`.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../content/typography`, `./element`, `./default.module.scss`.

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
- Storybook scenario: `../../clients/storybook/src/kit/core/components/controls/checkbox/checkbox.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
