# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/layout/card`.

## Что это

`Card` — компонент в срезе `core/components`.

## Назначение

Layout primitive для контейнера с режимами custom/elevated/flat и optional image slot.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/layout/card/index.ts`.
- Source: `src/core/components/layout/card/card.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.

## Public API и локальные файлы

- `export { Card } from './card.tsx';`
- Consumer import: `import { Card } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Card`.
- Props из `IProps`: `type`, `image`, `alignment`, `target`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Card } from './card.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `type`, `image`, `alignment`, `target`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.

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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/card/card.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
