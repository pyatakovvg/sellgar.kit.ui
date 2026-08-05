# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/radio`.

## Что это

`Radio` — компонент в срезе `core/components`.

## Назначение

Single-choice control primitive с label/caption.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `element`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/radio/index.ts`.
- Source: `src/core/components/controls/radio/radio.tsx`.
- Child node: `src/core/components/controls/radio/element`.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.

## Public API и локальные файлы

- `export { Radio } from './radio.tsx';`
- Consumer import: `import { Radio } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Radio`, `IProps`.
- Props из `IProps`: `size`, `label`, `caption`.
- Локальные parts: `element`.

## Контракт изменения

- Не менять локальные exports (`export { Radio } from './radio.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `size`, `label`, `caption`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.

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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/radio/radio.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
